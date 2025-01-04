#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { generateDocs } = require('../src/index');
const path = require('path');
const { normalize } = require('path');

yargs(hideBin(process.argv))
  .command('$0', 'Generate JSDoc for React components', (yargs) => {
    return yargs
      .option('dir', {
        alias: 'd',
        type: 'string',
        description: 'Directory to scan for React components',
        default: 'src',
        coerce: (dir) => normalize(dir)
      });
  }, (argv) => {
    try {
      generateDocs(argv.dir);
    } catch (error) {
      console.error('Error generating documentation:', error.message);
      process.exit(1);
    }
  })
  .help()
  .argv;
