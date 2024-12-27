const parser = require('@babel/parser');
const traverse = require('@babel/traverse').default;
const fs = require('fs');
const path = require('path');

function createParser() {
  const state = {
    fileSymbols: new Map(),
    fileImports: new Map(),
    symbolReferences: new Map()
  };

  function parseFile(filePath) {
    const code = fs.readFileSync(filePath, 'utf-8');
    const ast = parser.parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'typescript', 'classProperties', 'decorators-legacy']
    });

    const symbols = [];
    const imports = [];

    const visitors = {
      ImportDeclaration(path) {
        const importInfo = {
          source: path.node.source.value,
          specifiers: path.node.specifiers.map(spec => ({
            type: spec.type,
            local: spec.local.name,
            imported: spec.imported?.name || spec.local.name
          }))
        };
        imports.push(importInfo);
      },

      ClassDeclaration(path) {
        symbols.push({
          type: 'class',
          name: path.node.id.name,
          location: {
            start: path.node.loc.start.line,
            end: path.node.loc.end.line
          }
        });
      },

      FunctionDeclaration(path) {
        symbols.push({
          type: 'function',
          name: path.node.id.name,
          location: {
            start: path.node.loc.start.line,
            end: path.node.loc.end.line
          }
        });
      },

      VariableDeclaration(path) {
        path.node.declarations.forEach(decl => {
          if (decl.id.type === 'Identifier') {
            symbols.push({
              type: 'variable',
              name: decl.id.name,
              location: {
                start: decl.loc.start.line,
                end: decl.loc.end.line
              }
            });
          }
        });
      }
    };

    traverse(ast, visitors);

    state.fileSymbols.set(filePath, symbols);
    state.fileImports.set(filePath, imports);

    return { symbols, imports };
  }

  function generateKnowledge() {
    return {
      fileSymbols: Object.fromEntries(state.fileSymbols),
      fileImports: Object.fromEntries(state.fileImports),
      symbolReferences: Object.fromEntries(state.symbolReferences)
    };
  }

  return {
    parseFile,
    generateKnowledge
  };
}

module.exports = createParser; 
