const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babel = require('@babel/core');
const generator = require('@babel/generator').default;
const parser = require('@babel/parser');

const propsCache = new Map();

const reactJsDocPlugin = () => {
  return {
    visitor: {
      Program(path, state) {
        let componentInfo = {
          name: '',
          props: new Set(),
          hasSpreadProps: false,
          hasExistingJsDoc: false
        };

        // Check for existing JSDoc
        path.node.comments?.forEach(comment => {
          if (comment.type === 'CommentBlock' && comment.value.includes('@component')) {
            componentInfo.hasExistingJsDoc = true;
          }
        });

        if (componentInfo.hasExistingJsDoc) return;

        // Visit component declarations
        path.traverse({
          // 函數聲明組件
          FunctionDeclaration(path) {
            if (isReactComponent(path.node)) {
              componentInfo.name = path.node.id.name;
              analyzeComponent(path, componentInfo);
            }
          },
          // 箭頭函數和函數表達式組件
          VariableDeclarator(path) {
            const init = path.node.init;
            if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
              if (isReactComponent(init)) {
                componentInfo.name = path.node.id.name;
                analyzeComponent(path.get('init'), componentInfo);
              }
            }
          }
        });

        if (componentInfo.name && !componentInfo.hasExistingJsDoc) {
          const jsDoc = generateJsDoc(
            componentInfo.name, 
            Array.from(componentInfo.props), 
            componentInfo.hasSpreadProps
          );
          
          propsCache.set(state.filename, componentInfo);
          
          path.node.comments = path.node.comments || [];
          path.node.comments.unshift({
            type: 'CommentBlock',
            value: jsDoc
          });
        }
      }
    }
  };
};

function isReactComponent(node) {
  if (!node) return false;
  
  // 直接返回 JSX 的情況
  if (node.body?.type === 'JSXElement' || node.body?.type === 'JSXFragment') {
    return true;
  }

  // 在函數體內返回 JSX 的情況
  if (node.body?.type === 'BlockStatement') {
    let hasJsxReturn = false;
    babel.traverse(node.body, {
      ReturnStatement(path) {
        const returnType = path.node.argument?.type;
        if (returnType === 'JSXElement' || returnType === 'JSXFragment') {
          hasJsxReturn = true;
        }
      }
    }, { node: node.body });
    return hasJsxReturn;
  }

  return false;
}

function analyzeComponent(path, componentInfo) {
  path.traverse({
    // 解構 props
    ObjectPattern(path) {
      const parent = path.parentPath.node;
      if (parent.type === 'ArrowFunctionExpression' || 
          parent.type === 'FunctionExpression' ||
          parent.type === 'FunctionDeclaration') {
        path.node.properties.forEach(prop => {
          if (prop.type === 'ObjectProperty') {
            componentInfo.props.add(prop.key.name);
          } else if (prop.type === 'RestElement') {
            componentInfo.hasSpreadProps = true;
          }
        });
      }
    },
    // props.xxx 使用方式
    MemberExpression(path) {
      if (path.node.object.name === 'props') {
        componentInfo.props.add(path.node.property.name);
      }
    },
    // spread props
    SpreadElement(path) {
      if (path.node.argument.name === 'props') {
        componentInfo.hasSpreadProps = true;
      }
    }
  });
}

function generateJsDoc(componentName, props, hasSpreadProps) {
  let doc = `*\n * @component ${componentName}\n * @description React component\n * @param {Object} props Component props\n`;
  
  props.forEach(prop => {
    doc += ` * @param {*} props.${prop} - ${prop} prop\n`;
  });

  if (hasSpreadProps) {
    doc += ` * @param {...*} props.spread - Additional props are spread\n`;
  }

  doc += ` * @returns {JSX.Element} React component\n`;
  
  return doc;
}

async function generateDocs(directory) {
  const files = glob.sync(path.join(directory, '**/*.{js,jsx}'));

  for (const file of files) {
    const code = fs.readFileSync(file, 'utf-8');
    
    try {
      const result = await babel.transformAsync(code, {
        filename: file,
        plugins: [reactJsDocPlugin],
        parserOpts: {
          plugins: ['jsx'],
          sourceType: 'module'
        }
      });

      if (result && propsCache.has(file)) {
        fs.writeFileSync(file, result.code);
        console.log(`✅ Generated JSDoc for ${propsCache.get(file).componentName} in ${file}`);
      }
    } catch (error) {
      console.error(`❌ Error processing ${file}:`, error);
    }
  }
}

module.exports = {
  generateDocs,
  reactJsDocPlugin
};