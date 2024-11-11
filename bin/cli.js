#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { generateDocs } = require('../src/index');

yargs(hideBin(process.argv))
  .command('$0', 'Generate JSDoc for React components', (yargs) => {
    return yargs.option('dir', {
      alias: 'd',
      type: 'string',
      description: 'Directory to scan for React components',
      default: 'src'
    });
  }, (argv) => {
    generateDocs(argv.dir);
  })
  .help()
  .argv;