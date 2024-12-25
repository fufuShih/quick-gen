#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { generateDocs } = require('@genkit/react');

yargs(hideBin(process.argv))
  .command('react [dir]', 'Generate React documentation', (yargs) => {
    return yargs
      .positional('dir', {
        describe: 'Directory to scan for React components',
        default: 'src'
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        description: 'Output directory for documentation',
        default: 'docs'
      });
  }, (argv) => {
    try {
      generateDocs(argv.dir, argv.output);
    } catch (error) {
      console.error('Error generating documentation:', error.message);
      process.exit(1);
    }
  })
  .demandCommand(1, 'You need to specify a command')
  .help()
  .argv; 