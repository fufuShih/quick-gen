const fs = require('fs');
const path = require('path');
const glob = require('glob');
const babel = require('@babel/core');
const MagicString = require('magic-string');
const {
  isReactComponent,
  generateJsDoc,
} = require('./helper');
const { parseJSDoc, updateParsedJSDoc, serializeJSDoc } = require('./jsdoc-parser');


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
function reactJsDocPlugin(options = {}) {
  return {
    pre(file) {
      this.insertionPoints = [];
    },
    visitor: {
      CallExpression(path) {
        // if this CallExpression is memo(...) or forwardRef(...)
        // we treat it as the outermost layer of a component wrapped in a function
        const callee = path.node.callee;
        if (
          callee.type !== 'Identifier' ||
          (callee.name !== 'memo' && callee.name !== 'forwardRef')
        ) {
          return;
        }
  
        // Get the first argument: it could be an ArrowFunctionExpression or FunctionExpression
        const wrappedFn = path.node.arguments[0];
        if (!wrappedFn) return; // If no arguments, skip
  
        // Check if the inner wrapped function is a React Component
        // Use helper: isReactComponent(wrappedFn)
        if (!isReactComponent(wrappedFn)) {
          return;
        }
  
        // If it's already nested in another React Component, skip
        if (isInsideAnotherReactComponent(path)) {
          return;
        }
  
        // Find the outermost place to declare this Memo variable (VariableDeclarator or Export)
        // Similar to ArrowFunctionExpression
        const declaratorPath = path.findParent(p => p.isVariableDeclarator());
        if (!declaratorPath) {
          return;
        }
  
        const declarationPath = declaratorPath.parentPath; // Usually a VariableDeclaration
        let insertionNode;
        if (
          declarationPath.parentPath &&
          declarationPath.parentPath.isExportNamedDeclaration()
        ) {
          insertionNode = declarationPath.parentPath.node;
        } else if (declarationPath.isVariableDeclaration()) {
          insertionNode = declarationPath.node;
        }
        if (!insertionNode) return;
  
        // Check if there's already the same JSDoc
        const leadingComments = insertionNode.leadingComments || [];
        if (
          leadingComments.some(
            (comment) =>
              comment.type === 'CommentBlock' &&
              comment.value.includes('@component')
          )
        ) {
          return;
        }
  
        // Determine the component name (e.g. MemoButton)
        let componentName;
        if (declaratorPath.node.id.type === 'Identifier') {
          componentName = declaratorPath.node.id.name;
        } else {
          componentName = `AnonymousComponent_${Date.now()}`;
        }
  
        // Analyze props
        // Note: analyzeComponent() must receive the path of the ArrowFunctionExpression, 
        // so we can temporarily get the NodePath from callExpression.arguments[0]
        const wrappedFnPath = path.get('arguments.0');
        const componentInfo = {
          name: componentName,
          props: new Set(),
          hasSpreadProps: false,
          paramName: 'props'
        };
  
        analyzeComponent(wrappedFnPath, componentInfo);
  
        const jsDoc = generateJsDoc(
          componentInfo.name,
          Array.from(componentInfo.props),
          componentInfo.hasSpreadProps,
          componentInfo.paramName
        );
  
        if (typeof insertionNode.start === 'number') {
          this.insertionPoints.push({
            start: insertionNode.start,
            text: jsDoc + '\n'
          });
        }
      },

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
          Array.from(componentInfo.props),
          componentInfo.hasSpreadProps,
          componentInfo.paramName
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

        // Get existing comments
        const leadingComments = insertionNode.leadingComments || [];
        const existingJSDoc = leadingComments.find(
          comment => comment.type === 'CommentBlock' && 
                     (comment.value.includes('@component') || 
                      comment.value.includes('@typedef'))
        );

        if (existingJSDoc) {
          // If in update mode and has @generated, update the JSDoc
          if (options.update && existingJSDoc.value.includes('@generated')) {
            const parsedDoc = parseJSDoc(existingJSDoc.value);
            if (parsedDoc) {
              const componentInfo = {
                name: componentName,
                props: new Set(),
                hasSpreadProps: false,
                paramName: 'props'
              };

              analyzeComponent(path, componentInfo);
              
              updateParsedJSDoc(
                parsedDoc, 
                Array.from(componentInfo.props)
              );

              const updatedJSDoc = serializeJSDoc(parsedDoc);
              
              this.insertionPoints.push({
                start: insertionNode.start,
                text: updatedJSDoc + '\n'
              });
            }
          }
          return; // Skip if has JSDoc but not updating
        }

        // Generate new JSDoc if none exists
        const componentInfo = {
          name: componentName,
          props: new Set(),
          hasSpreadProps: false,
          paramName: 'props'
        };

        analyzeComponent(path, componentInfo);
        const jsDoc = generateJsDoc(
          componentInfo.name,
          Array.from(componentInfo.props),
          componentInfo.hasSpreadProps,
          componentInfo.paramName
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
            Array.from(componentInfo.props),
            componentInfo.hasSpreadProps,
            componentInfo.paramName
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

async function generateDocs(directory, options = {}) {
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
          plugins: [[reactJsDocPlugin, options]],
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
