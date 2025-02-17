const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babel = require('@babel/core');
const MagicString = require('magic-string');

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
 * Find if the current path is inside another React component
 * @param {import('@babel/core').NodePath} path
 * @returns {boolean}
 */
function isInsideAnotherReactComponent(path) {
  return !!path.findParent((p) => {
    // skip itself
    if (p === path) return false;
    // check if the parent is a React component
    return isReactComponent(p.node);
  });
}

/**
 * @type {import('@babel/core').PluginObj}
 */
function reactJsDocPlugin() {
  return {
    pre(file) {
      this.insertionPoints = [];
    },
    visitor: {
      FunctionDeclaration(path) {
        if (!isReactComponent(path.node)) return;
        if (isInsideAnotherReactComponent(path)) return;
        if (!path.node.id) return;

        // Check existing JSDoc
        const leadingComments = path.node.leadingComments || [];
        if (leadingComments.some(comment =>
          comment.type === 'CommentBlock' && comment.value.includes('@component')
        )) {
          return;
        }

        const componentName = path.node.id.name;
        const componentInfo = {
          name: componentName,
          props: new Set(),
          hasSpreadProps: false,
          paramName: 'props'
        };

        analyzeComponent(path, componentInfo);
        const jsDoc = generateJsDoc(
          componentInfo.name,
          componentInfo.paramName,
          Array.from(componentInfo.props),
          componentInfo.hasSpreadProps
        );

        // Check if it's in an export declaration
        let insertionNode = path.node;
        if (path.parentPath && path.parentPath.isExportNamedDeclaration()) {
          insertionNode = path.parentPath.node;
        }

        if (typeof insertionNode.start === 'number') {
          this.insertionPoints.push({
            start: insertionNode.start,
            text: jsDoc + '\n'
          });
        }
      },

      ArrowFunctionExpression(path) {
        if (!isReactComponent(path.node)) return;
        if (isInsideAnotherReactComponent(path)) return;

        const declaratorPath = path.findParent(p => p.isVariableDeclarator());
        if (!declaratorPath) return;

        const declarationPath = declaratorPath.parentPath;
        let insertionNode;

        // Check if it's in an export declaration
        if (declarationPath.parentPath && declarationPath.parentPath.isExportNamedDeclaration()) {
          insertionNode = declarationPath.parentPath.node;
        } else if (declarationPath.isVariableDeclaration()) {
          insertionNode = declarationPath.node;
        }

        if (!insertionNode) return;

        let componentName;
        if (declaratorPath.node.id.type === 'Identifier') {
          componentName = declaratorPath.node.id.name;
        } else {
          componentName = `AnonymousComponent_${Date.now()}`;
        }

        // Check existing JSDoc
        const leadingComments = insertionNode.leadingComments || [];
        if (leadingComments.some(comment =>
          comment.type === 'CommentBlock' && comment.value.includes('@component')
        )) {
          return;
        }

        const componentInfo = {
          name: componentName,
          props: new Set(),
          hasSpreadProps: false,
          paramName: 'props'
        };

        analyzeComponent(path, componentInfo);
        const jsDoc = generateJsDoc(
          componentInfo.name,
          componentInfo.paramName,
          Array.from(componentInfo.props),
          componentInfo.hasSpreadProps
        );

        if (typeof insertionNode.start === 'number') {
          this.insertionPoints.push({
            start: insertionNode.start,
            text: jsDoc + '\n'
          });
        }
      },

      ExportDefaultDeclaration(path) {
        const decl = path.node.declaration;
        if (
          decl.type === 'ArrowFunctionExpression' ||
          decl.type === 'FunctionDeclaration' ||
          decl.type === 'FunctionExpression'
        ) {
          if (!isReactComponent(decl)) return;
          if (isInsideAnotherReactComponent(path.get('declaration'))) return;

          const componentName = decl.id ? decl.id.name : 'DefaultExportComponent';

          // Check existing JSDoc
          const leadingComments = path.node.leadingComments || [];
          if (leadingComments.some(comment =>
            comment.type === 'CommentBlock' && comment.value.includes('@component')
          )) {
            return;
          }

          const componentInfo = {
            name: componentName,
            props: new Set(),
            hasSpreadProps: false,
            paramName: 'props'
          };

          analyzeComponent(path.get('declaration'), componentInfo);
          const jsDoc = generateJsDoc(
            componentInfo.name,
            componentInfo.paramName,
            Array.from(componentInfo.props),
            componentInfo.hasSpreadProps
          );

          // Use the start of ExportDefaultDeclaration
          if (typeof path.node.start === 'number') {
            this.insertionPoints.push({
              start: path.node.start,
              text: jsDoc + '\n'
            });
          }
        }
      }
    },
    post(file) {
      file.metadata.insertionPoints = this.insertionPoints;
    }
  };
}

/**
 * check whether the block contains return JSX
 * @param {import('@babel/core').types.Statement[]} statements
 * @param {Function} containsJSX
 * @param {Function} isWrappedComponent
 * @returns {boolean}
 */
function hasReturnStatementWithJSX(statements, containsJSX, isWrappedComponent) {
  for (const st of statements) {
    // 1) directly return
    if (
      st.type === 'ReturnStatement' &&
      st.argument &&
      (containsJSX(st.argument) || isWrappedComponent(st.argument))
    ) {
      return true;
    }

    // 2) if-statement, need to scan the consequent or alternate
    if (st.type === 'IfStatement') {
      // (A) if consequent is a ReturnStatement
      if (
        st.consequent &&
        st.consequent.type === 'ReturnStatement' &&
        st.consequent.argument &&
        (containsJSX(st.consequent.argument) || isWrappedComponent(st.consequent.argument))
      ) {
        return true;
      }
      // (B) if consequent is also an IfStatement, continue recursion
      if (st.consequent && st.consequent.type === 'IfStatement') {
        if (hasReturnStatementWithJSX([st.consequent], containsJSX, isWrappedComponent)) {
          return true;
        }
      }
      // (C) check the original block statement
      if (
        st.consequent?.type === 'BlockStatement' &&
        hasReturnStatementWithJSX(st.consequent.body, containsJSX, isWrappedComponent)
      ) {
        return true;
      }
      // (D) alternate is also an IfStatement
      if (st.alternate) {
        // (E) if alternate is a ReturnStatement
        if (
          st.alternate.type === 'ReturnStatement' &&
          st.alternate.argument &&
          (containsJSX(st.alternate.argument) || isWrappedComponent(st.alternate.argument))
        ) {
          return true;
        }
        // (F) if alternate is also an IfStatement
        if (st.alternate.type === 'IfStatement') {
          if (hasReturnStatementWithJSX([st.alternate], containsJSX, isWrappedComponent)) {
            return true;
          }
        }
        // (G) if alternate is a BlockStatement
        if (
          st.alternate.type === 'BlockStatement' &&
          hasReturnStatementWithJSX(st.alternate.body, containsJSX, isWrappedComponent)
        ) {
          return true;
        }
      }
    }

    // 3) other like for, while, switch ... you can recursively check as needed
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
    const restName = spreadProps.slice(3);
    doc += ` * @param {Object} ${paramName}.${restName} - [auto generate]\n`;
  } else if (hasSpreadProps) {
    doc += ` * @param {Object} ${paramName}.rest - [auto generate]\n`;
  }

  doc += ` * @returns {JSX.Element} React component\n`;
  doc += ` */`;
  
  return doc;
}

// New helper function to format JSDoc for addComment
function formatToBlockComment(fullJsDocString) {
  return fullJsDocString
    .replace(/^\/\*\*/, '')
    .replace(/\*\/$/, '')
    .trim();
}

/**
 * @param {string} directory
 */
async function generateDocs(directory) {
  try {
    console.log('🔍 Scanning directory:', directory);
    const files = glob.sync('**/*.{js,jsx}', {
      cwd: directory,
      absolute: true
    });

    if (files.length === 0) {
      console.log('⚠️ No JavaScript/React files found');
      return;
    }

    console.log(`📝 Found ${files.length} files...`);

    for (const file of files) {
      const code = fs.readFileSync(file, 'utf-8');
      try {
        const result = await babel.transformAsync(code, {
          filename: file,
          plugins: [reactJsDocPlugin()],
          parserOpts: {
            plugins: ['jsx'],
            sourceType: 'module',
            comments: true,
            tokens: true,
            ranges: true
          },
          babelrc: false,
          configFile: false
        });

        const insertionPoints = result.metadata.insertionPoints || [];
        
        if (insertionPoints.length > 0) {
          console.log(`Found ${insertionPoints.length} insertion points in ${file}`);
          
          // Use descending order
          insertionPoints.sort((a, b) => b.start - a.start);
          
          const s = new MagicString(code);
          
          for (const point of insertionPoints) {
            s.prependLeft(point.start, point.text);
          }

          fs.writeFileSync(file, s.toString(), 'utf-8');
          console.log(`✅ Processed: ${file}`);
        }
      } catch (err) {
        console.error(`❌ Error processing ${file}:`, err.message);
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

module.exports = {
  generateDocs,
  reactJsDocPlugin
};
