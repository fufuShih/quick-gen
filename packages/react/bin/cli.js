#!/usr/bin/env node
const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const { generateDocs } = require('../src/index');
const { normalize } = require('path');

function getGenerateOptions(argv) {
  const convertJsDocToType = !!(argv.convertJsDocToType || argv.convertJsdocToType);

  return {
    extensions: argv.extensions,
    output: argv.output || (convertJsDocToType ? 'type' : undefined),
    convertJsDocToType,
    keepJsDoc: !!(argv.keepJsDoc || argv.keepJsdoc),
    typeSuffix: argv.typeSuffix,
    exportTypes: !!argv.exportTypes,
    update: !!argv.update
  };
}

yargs(hideBin(process.argv))
  .command('$0', 'Generate JSDoc for React components', (yargs) => {
    return yargs
      .option('dir', {
        alias: 'd',
        type: 'string',
        description: 'Directory to scan for React components',
        default: 'src',
        coerce: (dir) => normalize(dir)
      })
      .option('update', {
        alias: 'u',
        type: 'boolean',
        description: 'Update existing @generated JSDoc (only modifies AutoGen props)',
        default: false
      })
      .option('extensions', {
        alias: 'e',
        type: 'string',
        description: 'Comma-separated file extensions to scan',
        default: 'js,jsx,ts,tsx'
      })
      .option('output', {
        alias: 'o',
        type: 'string',
        choices: ['jsdoc', 'type', 'both'],
        description: 'Output to generate'
      })
      .option('convert-jsdoc-to-type', {
        type: 'boolean',
        description: 'Convert quick-gen JSDoc blocks into TypeScript props types',
        default: false
      })
      .option('keep-jsdoc', {
        type: 'boolean',
        description: 'Keep existing JSDoc when converting to TypeScript types',
        default: false
      })
      .option('type-suffix', {
        type: 'string',
        description: 'Suffix for generated props type names',
        default: 'Props'
      })
      .option('export-types', {
        type: 'boolean',
        description: 'Add export to generated TypeScript types',
        default: false
      });
  }, (argv) => {
    try {
      generateDocs(argv.dir, getGenerateOptions(argv));
    } catch (error) {
      console.error('Error generating documentation:', error.message);
      process.exit(1);
    }
  })
  .help()
  .argv;
