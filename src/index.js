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

        // 改進檢測邏輯
        const checkForExistingJsDoc = (comments) => {
          return comments?.some(comment => 
            comment.type === 'CommentBlock' && 
            comment.value.includes('@component')
          ) || false;
        };

        // 分析組件
        path.traverse({
          FunctionDeclaration(path) {
            if (isReactComponent(path.node)) {
              componentInfo.name = path.node.id.name;
              componentInfo.hasExistingJsDoc = checkForExistingJsDoc(path.node.leadingComments);
              if (!componentInfo.hasExistingJsDoc) {
                analyzeComponent(path, componentInfo);
              }
            }
          },
          VariableDeclarator(path) {
            const init = path.node.init;
            if (init && (init.type === 'ArrowFunctionExpression' || init.type === 'FunctionExpression')) {
              if (isReactComponent(init)) {
                componentInfo.name = path.node.id.name;
                componentInfo.hasExistingJsDoc = checkForExistingJsDoc(path.node.leadingComments);
                if (!componentInfo.hasExistingJsDoc) {
                  analyzeComponent(path.get('init'), componentInfo);
                }
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
  
  // 改進 JSX 檢測
  const isJSX = (type) => {
    return type === 'JSXElement' || 
           type === 'JSXFragment' || 
           type === 'JSXText';
  };

  // 直接返回 JSX
  if (isJSX(node.body?.type)) {
    return true;
  }

  // 在函數體內返回 JSX
  if (node.body?.type === 'BlockStatement') {
    let hasJsxReturn = false;
    node.body.body.forEach(statement => {
      if (statement.type === 'ReturnStatement' && 
          isJSX(statement.argument?.type)) {
        hasJsxReturn = true;
      }
    });
    return hasJsxReturn;
  }

  return false;
}

function analyzeComponent(path, componentInfo) {
  path.traverse({
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
  try {
    console.log('🔍 Scanning directory:', directory);
    const files = glob.sync(path.join(directory, '**/*.{js,jsx}'));
    
    if (files.length === 0) {
      console.log('⚠️ No JavaScript/React files found in directory');
      return;
    }

    console.log(`📝 Found ${files.length} files to process...`);
    
    let processedCount = 0;
    let skippedCount = 0;
    
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
          processedCount++;
        } else {
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