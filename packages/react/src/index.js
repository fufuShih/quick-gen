const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babel = require('@babel/core');

const propsCache = new Map();
const processedComponents = new Set(); // Track processed components

/**
 * @typedef {Object} ComponentInfo
 * @property {string} name
 * @property {Set<string>} props
 * @property {boolean} hasSpreadProps
 * @property {number} lineNumber
 * @property {boolean} modified
 */

/**
 * @type {import('@babel/core').PluginObj}
 */
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
          lineNumber: path.node.loc?.start?.line || -1,
          modified: true,
          componentName,
          paramName: 'props'
        };

        // Handle missing loc
        const loc = path.node.loc;
        if (!loc || !loc.start) {
          componentInfo.lineNumber = -1;
        } else {
          componentInfo.lineNumber = loc.start.line;
        }

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

        // If componentName is undefined, provide a default name
        if (!componentName) {
          componentName = `AnonymousComponent_${Date.now()}`;
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
          lineNumber: (parent.node.type === 'VariableDeclarator' ? parent.node.loc?.start?.line : parent.parentPath.node.loc?.start?.line) || -1,
          modified: true,
          componentName,
          paramName: 'props'
        };

        // Handle missing loc
        const loc = (parent.node.type === 'VariableDeclarator' ? parent.node.loc : parent.parentPath.node.loc);
        if (!loc || !loc.start) {
          componentInfo.lineNumber = -1;
        } else {
          componentInfo.lineNumber = loc.start.line;
        }

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
          lineNumber: path.node.loc?.start?.line || -1,
          modified: true,
          componentName,
          paramName: 'props' // Add paramName
        };

        // Handle missing loc
        const loc = path.node.loc;
        if (!loc || !loc.start) {
          componentInfo.lineNumber = -1;
        } else {
          componentInfo.lineNumber = loc.start.line;
        }

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

/**
 * 檢查一個 block 裡是否有 return JSX
 * @param {import('@babel/core').types.Statement[]} statements
 * @param {Function} containsJSX
 * @param {Function} isWrappedComponent
 * @returns {boolean}
 */
function hasReturnStatementWithJSX(statements, containsJSX, isWrappedComponent) {
  for (const st of statements) {
    // 1) 直接碰到 return
    if (
      st.type === 'ReturnStatement' &&
      st.argument &&
      (containsJSX(st.argument) || isWrappedComponent(st.argument))
    ) {
      return true;
    }

    // 2) 如果是 if-statement，需要再深入 .consequent 或 .alternate
    if (st.type === 'IfStatement') {
      // if 的區塊
      if (
        st.consequent?.type === 'BlockStatement' &&
        hasReturnStatementWithJSX(st.consequent.body, containsJSX, isWrappedComponent)
      ) {
        return true;
      }
      // else 區塊
      if (st.alternate) {
        if (
          st.alternate.type === 'BlockStatement' &&
          hasReturnStatementWithJSX(st.alternate.body, containsJSX, isWrappedComponent)
        ) {
          return true;
        }
        // 有時 alternate 也是一個 if-statement（if-else if-else if...）
        if (
          st.alternate.type === 'IfStatement' &&
          hasReturnStatementWithJSX([st.alternate], containsJSX, isWrappedComponent)
        ) {
          return true;
        }
      }
    }

    // 3) 其他像是 for, while, switch ... 您可視需求遞迴
    if (st.type === 'ForStatement' || st.type === 'WhileStatement') {
      if (
        st.body?.type === 'BlockStatement' &&
        hasReturnStatementWithJSX(st.body.body, containsJSX, isWrappedComponent)
      ) {
        return true;
      }
    }

    if (st.type === 'SwitchStatement') {
      for (const cs of st.cases) {
        if (
          cs.consequent &&
          hasReturnStatementWithJSX(cs.consequent, containsJSX, isWrappedComponent)
        ) {
          return true;
        }
      }
    }

  }
  return false;
}

/**
 * @param {import('@babel/core').Node} node
 * @returns {boolean}
 */
function containsJSX(node) {
  if (!node) return false;

  // check whether the node is 'JSXElement' | 'JSXFragment' | 'JSXText'
  const isJSX = (type) => {
    return type === 'JSXElement' || 
           type === 'JSXFragment' || 
           type === 'JSXText';
  };

  // If self is JSX, return true
  if (isJSX(node.type)) {
    return true;
  }

  // Ternary operator, check its branches
  if (node.type === 'ConditionalExpression') {
    return containsJSX(node.consequent) || containsJSX(node.alternate);
  }

  // Logical operator, check left and right
  if (node.type === 'LogicalExpression') {
    return containsJSX(node.left) || containsJSX(node.right);
  }

  // Sequence operator, check each expression
  if (node.type === 'SequenceExpression') {
    return node.expressions.some(expr => containsJSX(expr));
  }

  // Parenthesized expression
  if (node.type === 'ParenthesizedExpression') {
    return containsJSX(node.expression);
  }

  // Other cases are temporarily considered false
  return false;
}

/**
 * detect whether the node is React component
 * @param {import('@babel/core').Node} node
 */
function isReactComponent(node) {
  if (!node) return false;

  // Keep the original "wrapped component" check...
  const isWrappedComponent = (node) => {
    if (node.type === 'CallExpression') {
      const callee = node.callee;
      if (
        callee.type === 'Identifier' &&
        (callee.name === 'memo' || callee.name === 'forwardRef')
      ) {
        const args = node.arguments;
        return args.length > 0 && isReactComponent(args[0]);
      }
    }
    return false;
  };

  // ArrowFunction / FunctionExpression
  if (
    node.type === 'ArrowFunctionExpression' ||
    node.type === 'FunctionExpression'
  ) {
    // check whether the body contains JSX
    if (containsJSX(node.body)) {
      return true;
    }
    // if body is a block statement, need to scan the whole block
    if (node.body?.type === 'BlockStatement') {
      return hasReturnStatementWithJSX(node.body.body, containsJSX, isWrappedComponent);
    }
  }

  // FunctionDeclaration
  if (node.type === 'FunctionDeclaration') {
    if (node.body && node.body.type === 'BlockStatement') {
      // scan the whole block
      return hasReturnStatementWithJSX(node.body.body, containsJSX, isWrappedComponent);
    }
  }

  // 3) if wrapped in memo(...)、forwardRef(...)
  if (isWrappedComponent(node)) {
    return true;
  }

  // default is not a React component
  return false;
}

/**
 * @param {import('@babel/core').NodePath} path
 * @param {ComponentInfo} componentInfo
 */
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
        VariableDeclarator(childPath) {
          const init = childPath.node.init;
          if (init && init.name === firstParam.name) {
            const id = childPath.node.id;
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
      if (componentInfo.paramName && path.node.argument.name === componentInfo.paramName) {
        componentInfo.hasSpreadProps = true;
      }
    }
  });

  console.log('Analyzing component:', componentInfo.name);
  console.log('Found props:', Array.from(componentInfo.props));
}

/**
 * @param {string} componentName
 * @param {string} paramName
 * @param {string[]} props
 * @param {boolean} hasSpreadProps
 * @returns {string}
 */
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
    doc += ` * @param {*} ${paramName}.${prop} - [auto generate]\n`;
  });

  if (spreadProps) {
    const restName = spreadProps.slice(3); // Remove '...' prefix
    doc += ` * @param {Object} ${paramName}.${restName} - [auto generate]\n`;
  } else if (hasSpreadProps) {
    doc += ` * @param {Object} ${paramName}.rest - [auto generate]\n`;
  }

  doc += ` * @returns {JSX.Element} React component\n`;
  doc += ` */`;
  
  return doc;
}

/**
 * @param {string} directory
 */
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
            const idx = component.lineNumber - 1;

            // Check if lineNumber is valid
            if (idx < 0 || idx >= lines.length) {
              console.warn(`Line number [${component.lineNumber}] is out of range in file: ${file}`);
              continue; // Skip this component
            }

            const componentLine = lines[idx];

            // Check if componentLine is a valid string
            if (typeof componentLine !== 'string') {
              console.warn(`Line content is not a valid string for line ${component.lineNumber} in file: ${file}`);
              continue; // Skip this component
            }

            const indentation = componentLine.match(/^\s*/)[0];
            const jsDocLines = component.jsDoc.split('\n')
              .map(line => indentation + line)
              .join('\n');
            lines.splice(idx, 0, jsDocLines);
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
