#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { glob } = require('glob');
const path = require('path');
const fs = require('fs');
const { mkdirp } = require('mkdirp');
const createParser = require('../src/parser');

// query knowledge base function
function queryKnowledge(filePath, options = {}) {
  const knowledgeDir = path.join(process.cwd(), '.knowledge');
  
  try {
    // read all knowledge files
    const fileSymbols = JSON.parse(fs.readFileSync(
      path.join(knowledgeDir, 'fileSymbols.json'), 
      'utf-8'
    ));
    
    const fileImports = JSON.parse(fs.readFileSync(
      path.join(knowledgeDir, 'fileImports.json'), 
      'utf-8'
    ));
    
    const symbolRefs = JSON.parse(fs.readFileSync(
      path.join(knowledgeDir, 'symbolReferences.json'), 
      'utf-8'
    ));

    // find target file info
    const fileInfo = {
      symbols: fileSymbols[filePath] || {},
      imports: fileImports[filePath] || {},
      references: symbolRefs[filePath] || {}
    };

    // format output
    console.log('\n=== File Knowledge ===');
    console.log(`\nFile: ${filePath}`);
    
    if (!options.imports && !options.refs) {
      console.log('\n--- Symbols ---');
      console.log(JSON.stringify(fileInfo.symbols, null, 2));
    }
    
    if (!options.symbols && !options.refs) {
      console.log('\n--- Imports ---');
      console.log(JSON.stringify(fileInfo.imports, null, 2));
    }
    
    if (!options.symbols && !options.imports) {
      console.log('\n--- References ---');
      console.log(JSON.stringify(fileInfo.references, null, 2));
    }

  } catch (error) {
    console.error('Error reading knowledge files:', error.message);
    console.error('Have you generated the knowledge base? Try running: knowledge generate');
  }
}

async function generateKnowledge() {
  const cwd = process.cwd();
  const knowledgeDir = path.join(cwd, '.knowledge');
  
  await mkdirp(knowledgeDir);
  const parser = createParser();
  
  const files = await glob('**/*.{js,jsx,ts,tsx}', {
    ignore: ['node_modules/**', 'dist/**', '.knowledge/**'],
    cwd
  });

  for (const file of files) {
    const filePath = path.join(cwd, file);
    try {
      parser.parseFile(filePath);
    } catch (error) {
      console.error(`Error parsing ${file}:`, error);
    }
  }

  const knowledge = parser.generateKnowledge();
  
  fs.writeFileSync(
    path.join(knowledgeDir, 'fileSymbols.json'),
    JSON.stringify(knowledge.fileSymbols, null, 2)
  );
  
  fs.writeFileSync(
    path.join(knowledgeDir, 'fileImports.json'),
    JSON.stringify(knowledge.fileImports, null, 2)
  );
  
  fs.writeFileSync(
    path.join(knowledgeDir, 'symbolReferences.json'),
    JSON.stringify(knowledge.symbolReferences, null, 2)
  );

  console.log('Knowledge files generated in .knowledge directory');
}

// Add new function to trace symbol calls
function traceSymbol(symbolName, options = {}) {
  const knowledgeDir = path.join(process.cwd(), '.knowledge');
  
  try {
    const fileSymbols = JSON.parse(fs.readFileSync(
      path.join(knowledgeDir, 'fileSymbols.json'), 
      'utf-8'
    ));
    
    const functionCalls = JSON.parse(fs.readFileSync(
      path.join(knowledgeDir, 'functionCalls.json'), 
      'utf-8'
    ));

    const fileImports = JSON.parse(fs.readFileSync(
      path.join(knowledgeDir, 'fileImports.json'), 
      'utf-8'
    ));

    // prepare output json structure
    const traceResult = {
      symbol: symbolName,
      definition: null,
      calls: [],
      imports: []
    };

    // find symbol definition
    for (const [file, symbols] of Object.entries(fileSymbols)) {
      const found = symbols.find(s => s.name === symbolName);
      if (found) {
        traceResult.definition = {
          file,
          ...found
        };
        break;
      }
    }

    if (!traceResult.definition) {
      console.log(JSON.stringify({ error: `Symbol '${symbolName}' not found` }, null, 2));
      return;
    }

    // Collect call information
    for (const [file, calls] of Object.entries(functionCalls)) {
      const relevantCalls = calls.filter(call => call.name === symbolName);
      if (relevantCalls.length > 0) {
        traceResult.calls.push({
          file,
          calls: relevantCalls
        });
      }
    }

    // Collect import information
    for (const [file, imports] of Object.entries(fileImports)) {
      const relevantImports = imports.filter(imp => 
        imp.specifiers.some(spec => spec.local === symbolName || spec.imported === symbolName)
      );
      if (relevantImports.length > 0) {
        traceResult.imports.push({
          file,
          imports: relevantImports
        });
      }
    }

    // output json
    console.log(JSON.stringify(traceResult, null, 2));

  } catch (error) {
    console.log(JSON.stringify({
      error: 'Error reading knowledge files',
      message: error.message,
      hint: 'Have you generated the knowledge base? Try running: knowledge generate'
    }, null, 2));
  }
}

yargs(hideBin(process.argv))
  .command('generate', 'Generate knowledge base for the current project', {}, generateKnowledge)
  .command('query <file>', 'Query knowledge base for a specific file', {
    symbols: {
      alias: 's',
      type: 'boolean',
      description: 'Show only symbols'
    },
    imports: {
      alias: 'i',
      type: 'boolean',
      description: 'Show only imports'
    },
    refs: {
      alias: 'r',
      type: 'boolean',
      description: 'Show only references'
    }
  }, (argv) => {
    const relativePath = path.relative(process.cwd(), path.resolve(argv.file));
    queryKnowledge(relativePath, {
      symbols: argv.symbols,
      imports: argv.imports,
      refs: argv.refs
    });
  })
  .command('trace <symbol>', 'Trace symbol usage and call chains', {
    detailed: {
      alias: 'd',
      type: 'boolean',
      description: 'Show detailed information including implementation'
    }
  }, (argv) => {
    traceSymbol(argv.symbol, {
      detailed: argv.detailed
    });
  })
  .command('help', 'Show help information', {}, (argv) => {
    yargs.showHelp();
  })
  .example('$0 generate', 'Generate knowledge base for current project')
  .example('$0 query src/components/Button.js', 'Show all information for Button.js')
  .example('$0 query src/components/Button.js -s', 'Show only symbols for Button.js')
  .example('$0 query src/components/Button.js -i', 'Show only imports for Button.js')
  .example('$0 query src/components/Button.js -r', 'Show only references for Button.js')
  .example('$0 trace myFunction', 'Show where myFunction is defined and called')
  .example('$0 trace MyComponent -d', 'Show detailed information about MyComponent')
  .demandCommand(1, 'You need at least one command before moving on')
  .help('h')
  .alias('h', 'help')
  .version('version', '1.0.0')
  .alias('v', 'version')
  .epilogue('For more information, visit https://github.com/fufuShih/quick-gen')
  .parse(); 
