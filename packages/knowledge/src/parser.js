const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const path = require('path');

function createParser() {
  const state = {
    // Store all file information
    files: new Map(),
    // Store all symbol reference relationships
    symbolGraph: new Map(),
    // Add new state for tracking function calls
    functionCalls: new Map()
  };

  function parseFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy']
    });

    const fileInfo = {
      timestamp: Date.now(),
      path: filePath,
      symbols: [],
      dependencies: {
        imports: [],      // Direct module imports
        references: [],   // Symbols used in code
        exports: []       // Exported symbols
      }
    };

    const visitors = {
      // Handle import statements
      ImportDeclaration(path) {
        const importInfo = {
          source: path.node.source.value,
          specifiers: path.node.specifiers.map(spec => ({
            type: spec.type,
            local: spec.local.name,
            imported: spec.imported?.name || spec.local.name
          })),
          location: {
            start: path.node.loc.start.line,
            end: path.node.loc.end.line
          }
        };
        fileInfo.dependencies.imports.push(importInfo);

        // Record symbol reference relationships
        path.node.specifiers.forEach(spec => {
          const reference = {
            type: 'import',
            source: importInfo.source,
            local: spec.local.name,
            imported: spec.imported?.name || spec.local.name,
            location: importInfo.location
          };
          fileInfo.dependencies.references.push(reference);
        });
      },

      // Handle class definitions
      ClassDeclaration(path) {
        const classInfo = {
          type: 'class',
          name: path.node.id.name,
          location: {
            start: path.node.loc.start.line,
            end: path.node.loc.end.line
          },
          properties: [],
          methods: [],
          superClass: path.node.superClass?.name,
          implements: path.node.implements?.map(impl => impl.expression.name) || [],
          decorators: path.node.decorators?.map(d => d.expression.name) || []
        };

        // Collect class members
        path.node.body.body.forEach(member => {
          if (member.type === 'ClassProperty') {
            classInfo.properties.push({
              name: member.key.name,
              type: member.typeAnnotation?.typeAnnotation.type
            });
          } else if (member.type === 'ClassMethod') {
            classInfo.methods.push({
              name: member.key.name,
              params: member.params.map(p => p.name),
              async: member.async,
              kind: member.kind // constructor, method, get, set
            });
          }
        });

        fileInfo.symbols.push(classInfo);

        // Record inheritance relationships
        if (classInfo.superClass) {
          fileInfo.dependencies.references.push({
            type: 'extends',
            name: classInfo.superClass,
            location: path.node.superClass.loc
          });
        }
      },

      // Handle function definitions
      FunctionDeclaration(path) {
        const funcInfo = {
          type: 'function',
          name: path.node.id.name,
          params: path.node.params.map(p => p.name),
          async: path.node.async,
          generator: path.node.generator,
          location: {
            start: path.node.loc.start.line,
            end: path.node.loc.end.line
          }
        };
        fileInfo.symbols.push(funcInfo);
      },

      // Handle variable definitions
      VariableDeclaration(path) {
        path.node.declarations.forEach(decl => {
          if (decl.id.type === 'Identifier') {
            const varInfo = {
              type: 'variable',
              name: decl.id.name,
              kind: path.node.kind, // const, let, var
              location: {
                start: decl.loc.start.line,
                end: decl.loc.end.line
              }
            };
            fileInfo.symbols.push(varInfo);
          }
        });
      },

      // Handle export statements
      ExportNamedDeclaration(path) {
        const exportInfo = {
          type: 'named',
          specifiers: path.node.specifiers.map(spec => ({
            local: spec.local.name,
            exported: spec.exported.name
          })),
          location: {
            start: path.node.loc.start.line,
            end: path.node.loc.end.line
          }
        };
        fileInfo.dependencies.exports.push(exportInfo);
      },

      ExportDefaultDeclaration(path) {
        const exportInfo = {
          type: 'default',
          name: path.node.declaration.name,
          location: {
            start: path.node.loc.start.line,
            end: path.node.loc.end.line
          }
        };
        fileInfo.dependencies.exports.push(exportInfo);
      },

      // Add new visitor for tracking function calls
      CallExpression(path) {
        let calleeName;
        if (path.node.callee.type === 'Identifier') {
          calleeName = path.node.callee.name;
        } else if (path.node.callee.type === 'MemberExpression') {
          calleeName = path.node.callee.property.name;
        }

        if (calleeName) {
          const callInfo = {
            name: calleeName,
            location: {
              start: path.node.loc.start.line,
              end: path.node.loc.end.line
            },
            arguments: path.node.arguments.map(arg => {
              if (arg.type === 'Identifier') {
                return arg.name;
              }
              return arg.type;
            }),
            context: path.scope.getFunctionParent()?.block?.id?.name || 'global'
          };

          const calls = state.functionCalls.get(filePath) || [];
          calls.push(callInfo);
          state.functionCalls.set(filePath, calls);
        }
      }
    };

    traverse(ast, visitors);
    state.files.set(filePath, fileInfo);

    return fileInfo;
  }

  function generateKnowledge() {
    const knowledge = {
      files: {},
      dependencies: {},
      symbols: {},
      // Add function calls to knowledge
      functionCalls: {}
    };

    // Convert file information
    for (const [filePath, fileInfo] of state.files) {
      knowledge.files[filePath] = {
        timestamp: fileInfo.timestamp,
        symbols: fileInfo.symbols,
        dependencies: fileInfo.dependencies
      };

      // Build symbol index
      fileInfo.symbols.forEach(symbol => {
        const symbolId = `${filePath}:${symbol.name}`;
        knowledge.symbols[symbolId] = {
          ...symbol,
          definedIn: filePath,
          references: []
        };
      });

      // Build dependency relationships
      knowledge.dependencies[filePath] = {
        imports: fileInfo.dependencies.imports,
        references: fileInfo.dependencies.references,
        exports: fileInfo.dependencies.exports
      };
    }

    // Add function calls to knowledge
    for (const [filePath, calls] of state.functionCalls) {
      knowledge.functionCalls[filePath] = calls;
    }

    return knowledge;
  }

  return {
    parseFile,
    generateKnowledge
  };
}

module.exports = createParser; 
