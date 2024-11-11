const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babel = require('@babel/core');
const generator = require('@babel/generator').default;

const propsCache = new Map();

// Babel plugin to analyze React components
const reactJsDocPlugin = () => {
  return {
    visitor: {
      Program(path, state) {
        let componentName = '';
        let props = new Set();
        let hasSpreadProps = false;
        let hasExistingJsDoc = false;

        // Check for existing JSDoc
        path.node.comments?.forEach(comment => {
          if (comment.type === 'CommentBlock' && comment.value.includes('@component')) {
            hasExistingJsDoc = true;
          }
        });

        if (hasExistingJsDoc) {
          return;
        }

        // Visit component declarations
        path.traverse({
          FunctionDeclaration(path) {
            if (isReactComponent(path.node)) {
              componentName = path.node.id.name;
              analyzeFunctionComponent(path, props, hasSpreadProps);
            }
          },
          ArrowFunctionExpression(path) {
            if (isReactComponent(path.parentPath)) {
              componentName = path.parentPath.node.id.name;
              analyzeFunctionComponent(path, props, hasSpreadProps);
            }
          }
        });

        if (componentName && !hasExistingJsDoc) {
          const jsDoc = generateJsDoc(componentName, Array.from(props), hasSpreadProps);
          propsCache.set(state.filename, {
            componentName,
            props: Array.from(props),
            hasSpreadProps
          });
          
          // Add JSDoc to component
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
  return node.returnType?.typeAnnotation?.type === 'JSXElement' ||
         node.body?.type === 'JSXElement';
}

function analyzeFunctionComponent(path, props, hasSpreadProps) {
  path.traverse({
    ObjectPattern(path) {
      if (path.parentPath.node.params?.[0]?.name === 'props') {
        path.node.properties.forEach(prop => {
          if (prop.type === 'ObjectProperty') {
            props.add(prop.key.name);
          }
        });
      }
    },
    MemberExpression(path) {
      if (path.node.object.name === 'props') {
        props.add(path.node.property.name);
      }
    },
    SpreadElement(path) {
      if (path.node.argument.name === 'props') {
        hasSpreadProps = true;
      }
    }
  });
}

function generateJsDoc(componentName, props, hasSpreadProps) {
  let doc = `*\n * @component ${componentName}\n * @param {Object} props\n`;
  
  props.forEach(prop => {
    doc += ` * @param {any} props.${prop}\n`;
  });

  if (hasSpreadProps) {
    doc += ` * @param {...any} props.spread Additional props are spread\n`;
  }

  doc += ` * @returns {JSX.Element}\n`;
  
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
          plugins: ['jsx']
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