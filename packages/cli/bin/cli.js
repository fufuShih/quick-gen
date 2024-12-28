#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { generateDocs, generateKnowledge } = require('../src/index.js');

yargs(hideBin(process.argv))
  .command('react', 'Generate JSDoc for React components', (yargs) => {
    return yargs
      .option('dir', {
        alias: 'd',
        type: 'string',
        description: 'Directory to scan for React components',
        default: 'src'
      });
  }, (argv) => {
    try {
      const fullPath = argv.dir ? `${process.cwd()}/${argv.dir}` : `${process.cwd()}/src`;
      console.log('Scanning directory:', fullPath);
      generateDocs(fullPath);
    } catch (error) {
      console.error('Error generating documentation:', error.message);
      process.exit(1);
    }
  })
  .command('knowledge', 'Generate knowledge graph for JavaScript/TypeScript projects', (yargs) => {
    return yargs
      .option('dir', {
        alias: 'd',
        type: 'string',
        description: 'Directory to scan for JS/TS files',
        default: '.'
      });
  }, (argv) => {
    try {
      const fullPath = argv.dir ? `${process.cwd()}/${argv.dir}` : process.cwd();
      console.log('Generating knowledge graph from:', fullPath);
      generateKnowledge(fullPath);
    } catch (error) {
      console.error('Error generating knowledge graph:', error.message);
      process.exit(1);
    }
  })
  .demandCommand(1, 'You need to specify a command')
  .help()
  .argv; 
