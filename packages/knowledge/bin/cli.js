#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { glob } = require('glob');
const path = require('path');
const fs = require('fs');
const { mkdirp } = require('mkdirp');
const createParser = require('../src/parser');

// 查詢知識庫的函數
function queryKnowledge(filePath, options = {}) {
  const knowledgeDir = path.join(process.cwd(), '.knowledge');
  
  try {
    // 讀取所有知識檔案
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

    // 找到目標檔案的資訊
    const fileInfo = {
      symbols: fileSymbols[filePath] || {},
      imports: fileImports[filePath] || {},
      references: symbolRefs[filePath] || {}
    };

    // 格式化輸出
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

// 設定 CLI 命令
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
  .command('help', 'Show help information', {}, (argv) => {
    yargs.showHelp();
  })
  .example('$0 generate', 'Generate knowledge base for current project')
  .example('$0 query src/components/Button.js', 'Show all information for Button.js')
  .example('$0 query src/components/Button.js -s', 'Show only symbols for Button.js')
  .example('$0 query src/components/Button.js -i', 'Show only imports for Button.js')
  .example('$0 query src/components/Button.js -r', 'Show only references for Button.js')
  .demandCommand(1, 'You need at least one command before moving on')
  .help('h')
  .alias('h', 'help')
  .version('version', '1.0.0')
  .alias('v', 'version')
  .epilogue('For more information, visit https://github.com/fufuShih/quick-gen')
  .parse(); 
