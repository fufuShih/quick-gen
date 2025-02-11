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
          componentName
        };

        analyzeComponent(path, componentInfo);
        if (componentInfo.props.size > 0 || componentInfo.hasSpreadProps) {
          const jsDoc = generateJsDoc(
            componentInfo.name,
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
      }
    },
    ArrowFunctionExpression(path) {
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
          componentName
        };
        analyzeComponent(path, componentInfo);
        if (componentInfo.props.size > 0 || componentInfo.hasSpreadProps) {
          const jsDoc = generateJsDoc(
            componentInfo.name,
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
  if (path.node.params && path.node.params[0]) {
    const firstParam = path.node.params[0];
    if (firstParam.type === 'Identifier') {
      // 尋找解構賦值
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

  // Analyze props usage in the component body
  path.traverse({
    MemberExpression(path) {
      if (path.node.object.name === 'props') {
        componentInfo.props.add(path.node.property.name);
      }
    },
    SpreadElement(path) {
      if (path.node.argument.name === 'props') {
        componentInfo.hasSpreadProps = true;
      }
    }
  });

  console.log('Analyzing component:', componentInfo.name);
  console.log('Found props:', Array.from(componentInfo.props));
}

function generateJsDoc(componentName, props, hasSpreadProps) {
  let doc = '';
  doc += `/**\n`;
  doc += ` * @component ${componentName.replace(/^_+/, '')}\n`;
  doc += ` * @description React component\n`;
  doc += ` * @param {Object} props Component props\n`;
  
  const normalProps = props.filter(prop => !prop.startsWith('...'));
  const spreadProps = props.find(prop => prop.startsWith('...'));
  
  normalProps.forEach(prop => {
    doc += ` * @param {*} props.${prop} - ${prop} prop\n`;
  });

  if (spreadProps) {
    const restName = spreadProps.slice(3); // Remove '...' prefix
    doc += ` * @param {Object} props.${restName} - Additional props are spread\n`;
  } else if (hasSpreadProps) {
    doc += ` * @param {Object} props.rest - Additional props are spread\n`;
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
