const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babel = require('@babel/core');
const MagicString = require('magic-string');
const {
  isReactComponent,
  generateJsDoc,
} = require('./helper');


/**
 * @typedef {Object} ComponentInfo
 * @property {string} name
 * @property {Set<string>} props
 * @property {boolean} hasSpreadProps
 * @property {number} lineNumber
 * @property {boolean} modified
 */

/**
 * @param {import('@babel/core').NodePath} path
 * @returns {boolean}
 */
function isInsideAnotherReactComponent(path) {
  return !!path.findParent((p) => {
    if (p === path) return false;
    return isReactComponent(p.node);
  });
}

/**
 * @param {import('@babel/core').NodePath} path
 * @param {ComponentInfo} componentInfo
 */
function analyzeComponent(path, componentInfo) {
  // Analyze props from parameters
  let paramName = null;
  if (path.node.params && path.node.params[0]) {
    const firstParam = path.node.params[0];
    if (firstParam.type === 'Identifier') {
      paramName = firstParam.name;
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

  componentInfo.paramName = paramName || 'props';

  path.traverse({
    MemberExpression(path) {
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
 * @type {import('@babel/core').PluginObj}
 */
function reactJsDocPlugin() {
  return {
    pre(file) {
      this.insertionPoints = [];
    },
    visitor: {
      FunctionDeclaration(path) {
        if (path.findParent((p) => p.isExportDefaultDeclaration())) return;

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
        if (path.findParent((p) => p.isExportDefaultDeclaration())) return;

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
    
    // Calculate the number of files
    let processedFiles = 0;
    let modifiedFiles = 0;
    let errorFiles = 0;
    let skippedFiles = 0;

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
        processedFiles++;
        
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
          modifiedFiles++;
        } else {
          skippedFiles++;
          console.log(`⏭️ Skipped: ${file} (JSDoc already exists)`);
        }
      } catch (err) {
        console.error(`❌ Error processing ${file}:`, err.message);
        errorFiles++;
      }
    }

    // Add summary
    console.log('\n📊 Summary:');
    console.log(`Total files scanned: ${files.length}`);
    console.log(`Successfully processed: ${processedFiles}`);
    console.log(`Files with added JSDoc: ${modifiedFiles}`);
    console.log(`Files skipped (already documented): ${skippedFiles}`);
    console.log(`Files with errors: ${errorFiles}`);

  } catch (error) {
    console.error('❌ Error:', error);
    throw error;
  }
}

module.exports = {
  generateDocs,
  reactJsDocPlugin
};
