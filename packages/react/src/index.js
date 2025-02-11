const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babel = require('@babel/core');
const generator = require('@babel/generator').default;
const parser = require('@babel/parser');

const propsCache = new Map();
const processedComponents = new Set(); // Track processed components

const reactJsDocPlugin = {
  visitor: {
    FunctionDeclaration(path) {
      if (!isReactComponent(path.node)) return;
      if (path.node.id) {
        const filename = path.hub.file.opts.filename;
        const componentName = path.node.id.name;
        
        // Check if component already processed
        const componentKey = `${filename}:${componentName}`;
        if (processedComponents.has(componentKey)) {
          return;
        }

        // Skip if component already has JSDoc
        const leadingComments = path.node.leadingComments;
        if (leadingComments && leadingComments.some(comment => 
          comment.type === 'CommentBlock' && comment.value.includes('@component'))) {
          return;
        }

        const componentInfo = {
          name: componentName,
          props: new Set(),
          hasSpreadProps: false,
          lineNumber: path.node.loc.start.line,
          modified: true,
          componentName,
          paramName: 'props'
        };

        analyzeComponent(path, componentInfo);
        const jsDoc = generateJsDoc(
          componentInfo.name,
          componentInfo.paramName,
          Array.from(componentInfo.props),
          componentInfo.hasSpreadProps
        );

        // Initialize components array if not exists
        if (!propsCache.has(filename)) {
          propsCache.set(filename, []);
        }
        propsCache.get(filename).push({
          ...componentInfo,
          jsDoc
        });
        
        // Mark component as processed
        processedComponents.add(componentKey);
      }
    },
    ArrowFunctionExpression(path) {
      if (!isReactComponent(path.node)) return;
      const parent = path.parentPath;
      if (parent.node.type === 'VariableDeclarator' || parent.node.type === 'CallExpression') {
        const filename = path.hub.file.opts.filename;
        let componentName;
        if (parent.node.type === 'VariableDeclarator') {
          componentName = parent.node.id.name;
        } else if (parent.node.type === 'CallExpression' && parent.parentPath.node.type === 'VariableDeclarator') {
          componentName = parent.parentPath.node.id.name;
        }

        // Check if component already processed
        const componentKey = `${filename}:${componentName}`;
        if (processedComponents.has(componentKey)) {
          return;
        }

        // Skip if component already has JSDoc
        const leadingComments = parent.node.leadingComments || 
                              (parent.parentPath && parent.parentPath.node.leadingComments);
        if (leadingComments && leadingComments.some(comment => 
          comment.type === 'CommentBlock' && comment.value.includes('@component'))) {
          return;
        }

        const componentInfo = {
          name: componentName,
          props: new Set(),
          hasSpreadProps: false,
          lineNumber: parent.node.type === 'VariableDeclarator' ? parent.node.loc.start.line : parent.parentPath.node.loc.start.line,
          modified: true,
          componentName,
          paramName: 'props'
        };
        analyzeComponent(path, componentInfo);
        const jsDoc = generateJsDoc(
          componentInfo.name,
          componentInfo.paramName,
          Array.from(componentInfo.props),
          componentInfo.hasSpreadProps
        );

        // Initialize components array if not exists
        if (!propsCache.has(filename)) {
          propsCache.set(filename, []);
        }
        propsCache.get(filename).push({
          ...componentInfo,
          jsDoc
        });
        
        // Mark component as processed
        processedComponents.add(componentKey);
      }
    },
    ExportDefaultDeclaration(path) {
      const decl = path.node.declaration;
      if (
        decl.type === 'ArrowFunctionExpression' ||
        decl.type === 'FunctionDeclaration' ||
        decl.type === 'FunctionExpression'
      ) {
        // Check if it's a React Component
        if (!isReactComponent(decl)) return;

        // Assign default name if anonymous, otherwise use existing name
        const componentName = decl.id ? decl.id.name : 'DefaultExportComponent';

        // Check if component already processed
        const filename = path.hub.file.opts.filename;
        const componentKey = `${filename}:${componentName}`;
        if (processedComponents.has(componentKey)) {
          return;
        }

        // Check if JSDoc already exists
        const leadingComments = path.node.leadingComments;
        if (leadingComments && leadingComments.some(comment =>
          comment.type === 'CommentBlock' && comment.value.includes('@component')
        )) {
          return;
        }

        // Create componentInfo
        const componentInfo = {
          name: componentName,
          props: new Set(),
          hasSpreadProps: false,
          lineNumber: path.node.loc.start.line,
          modified: true,
          componentName,
          paramName: 'props' // Add paramName
        };

        analyzeComponent(path.get('declaration'), componentInfo);

        const jsDoc = generateJsDoc(
          componentInfo.name,
          componentInfo.paramName, // Pass paramName
          Array.from(componentInfo.props),
          componentInfo.hasSpreadProps
        );

        if (!propsCache.has(filename)) {
          propsCache.set(filename, []);
        }
        propsCache.get(filename).push({
          ...componentInfo,
          jsDoc
        });
        processedComponents.add(componentKey);
      }
    }
  }
};

function isReactComponent(node) {
  if (!node) return false;
  
  // Improved JSX detection
  const isJSX = (type) => {
    return type === 'JSXElement' || 
           type === 'JSXFragment' || 
           type === 'JSXText' ||
           type === 'JSXFragment';
  };

  // Check if it's wrapped in memo or other HOCs
  const isWrappedComponent = (node) => {
    if (node.type === 'CallExpression') {
      const callee = node.callee;
      // Check for memo(Component) pattern
      if (callee.type === 'Identifier' && 
          (callee.name === 'memo' || callee.name === 'forwardRef')) {
        const args = node.arguments;
        return args.length > 0 && isReactComponent(args[0]);
      }
    }
    return false;
  };

  // For arrow functions and function expressions
  if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
    // Direct JSX return
    if (isJSX(node.body?.type)) {
      return true;
    }
    // Block with return statement
    if (node.body?.type === 'BlockStatement') {
      return node.body.body.some(statement => 
        statement.type === 'ReturnStatement' && 
        statement.argument && 
        (isJSX(statement.argument.type) || isWrappedComponent(statement.argument))
      );
    }
  }

  // For function declarations
  if (node.type === 'FunctionDeclaration') {
    return node.body.body.some(statement => 
      statement.type === 'ReturnStatement' && 
      statement.argument && 
      (isJSX(statement.argument.type) || isWrappedComponent(statement.argument))
    );
  }

  // For wrapped components (memo, forwardRef, etc.)
  if (isWrappedComponent(node)) {
    return true;
  }

  return false;
}

function analyzeComponent(path, componentInfo) {
  // Analyze props from parameters
  let paramName = null; // Store the parameter name
  if (path.node.params && path.node.params[0]) {
    const firstParam = path.node.params[0];
    if (firstParam.type === 'Identifier') {
      // Capture the parameter name if it's an Identifier
      paramName = firstParam.name;
      // find the variable declarator that has the same name as the first param
      path.traverse({
        VariableDeclarator(path) {
          const init = path.node.init;
          if (init && init.name === firstParam.name) {
            const id = path.node.id;
            if (id.type === 'ObjectPattern') {
              id.properties.forEach(prop => {
                if (prop.type === 'ObjectProperty') {
                  componentInfo.props.add(prop.key.name);
                } else if (prop.type === 'RestElement') {
                  componentInfo.hasSpreadProps = true;
                  componentInfo.props.add('...' + prop.argument.name);
                }
              });
            }
          }
        }
      });
    }
    if (firstParam.type === 'ObjectPattern') {
      firstParam.properties.forEach(prop => {
        if (prop.type === 'ObjectProperty') {
          componentInfo.props.add(prop.key.name);
        } else if (prop.type === 'RestElement') {
          componentInfo.hasSpreadProps = true;
          componentInfo.props.add('...' + prop.argument.name);
        }
      });
    }
  }

  // No parameter or no identifier, default to 'props'
  componentInfo.paramName = paramName || 'props';

  // Analyze props usage in the component body
  path.traverse({
    MemberExpression(path) {
      // Use the captured parameter name instead of "props"
      if (componentInfo.paramName && path.node.object.name === componentInfo.paramName) {
        componentInfo.props.add(path.node.property.name);
      }
    },
    SpreadElement(path) {
      // This part seems to assume the spread is always on 'props'.
      // It might be good to check if this is always the case, or if
      // we need to adapt this as well.  For now, I'll leave it as is
      // since the user's instructions focused on MemberExpression.
      if (path.node.argument.name === 'props') {
        componentInfo.hasSpreadProps = true;
      }
    }
  });

  console.log('Analyzing component:', componentInfo.name);
  console.log('Found props:', Array.from(componentInfo.props));
}

function generateJsDoc(componentName, paramName, props, hasSpreadProps) {
  let doc = '';
  doc += `/**\n`;
  doc += ` * @generated ${Date.now()}\n`;
  doc += ` * @component ${componentName.replace(/^_+/, '')}\n`;
  doc += ` *\n`;
  doc += ` * @param {Object} ${paramName} Component props\n`;
  
  const normalProps = props.filter(prop => !prop.startsWith('...'));
  const spreadProps = props.find(prop => prop.startsWith('...'));
  
  normalProps.forEach(prop => {
    doc += ` * @param {*} ${paramName}.${prop} - ${prop} prop\n`;
  });

  if (spreadProps) {
    const restName = spreadProps.slice(3); // Remove '...' prefix
    doc += ` * @param {Object} ${paramName}.${restName} - Additional props are spread\n`;
  } else if (hasSpreadProps) {
    doc += ` * @param {Object} ${paramName}.rest - Additional props are spread\n`;
  }

  doc += ` * @returns {JSX.Element} React component\n`;
  doc += ` */`;
  
  return doc;
}

function hasComponentJSDoc(code) {
  // Check if there's already a JSDoc comment with @component
  const jsDocRegex = /\/\*\*[\s\S]*?@component[\s\S]*?\*\//;
  return jsDocRegex.test(code);
}

async function generateDocs(directory) {
  try {
    // Reset all states
    processedComponents.clear();
    propsCache.clear(); // Add this line to ensure the cache starts empty each time
    
    console.log('🔍 Scanning directory:', directory);
    const files = glob.sync('**/*.{js,jsx}', { 
      cwd: directory,
      absolute: true
    });
    
    if (files.length === 0) {
      console.log('⚠️ No JavaScript/React files found in directory');
      console.log('Looking in:', directory);
      return;
    }

    console.log(`📝 Found ${files.length} files to process...`);
    
    let processedCount = 0;
    let skippedCount = 0;
    
    for (const file of files) {
      const absolutePath = path.resolve(file);
      let code = fs.readFileSync(file, 'utf-8');
      
      try {
        // Clear processed components before processing each file
        processedComponents.clear();
        
        const result = await babel.transformAsync(code, {
          filename: absolutePath,
          plugins: [reactJsDocPlugin],
          parserOpts: {
            plugins: ['jsx'],
            sourceType: 'module'
          },
          babelrc: false,
          configFile: false
        });

        const components = propsCache.get(absolutePath) || [];
        if (result && components.length > 0) {
          // Sort components by line number in descending order
          components.sort((a, b) => b.lineNumber - a.lineNumber);
          
          const lines = code.split('\n');
          
          // Add JSDoc for each component from bottom to top
          for (const component of components) {
            const componentLine = lines[component.lineNumber - 1];
            const indentation = componentLine.match(/^\s*/)[0];
            const jsDocLines = component.jsDoc.split('\n')
              .map(line => indentation + line)
              .join('\n');
            lines.splice(component.lineNumber - 1, 0, jsDocLines);
          }
          
          code = lines.join('\n').replace(/\r\n/g, '\n');
          fs.writeFileSync(file, code);
          console.log(`✅ Generated JSDoc for ${components.length} components in ${file}`);
          processedCount++;
        } else {
          console.log(`⚠️ Skipped ${file} - No React components found or already documented`);
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error processing ${file}:`, error.message);
        skippedCount++;
      }
    }

    console.log('\n📊 Summary:');
    console.log(`Total files found: ${files.length}`);
    console.log(`Files updated: ${processedCount}`);
    console.log(`Files skipped: ${skippedCount}`);

  } catch (error) {
    console.error('❌ Error during generation:', error);
    throw error;
  }
}

module.exports = {
  generateDocs,
  reactJsDocPlugin
};
