#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { generateDocs } = require('../src/index.js');

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
  .demandCommand(1, 'You need to specify a command')
  .help()
  .argv; 