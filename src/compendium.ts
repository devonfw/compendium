#!/usr/bin/env node

import chalk from 'chalk';
import { Credentials } from './types';
import { doCompendium, askInPrompt } from './clinterpreter';
import * as yargs from 'yargs';

//sample with asciidoc local and confluence external(check credentials) and many local documents
//murta.sanjuan-ases-external@capgemini.com   Admin1234
//ts-node src/compendium.ts -f test-data/input/config.json --html out/out

//sample with url-html:
//ts-node src/compendium.ts -f test-data/confiles/html-url/config.json --html out/out
//sample with url-html all index html links
//ts-node src/compendium.ts -f test-data/confiles/html-url/configAllIndex.json --html out/out

let configFile, outputFile, multiple, outputFormat, inputFormat;

(async () => {
  const cli = yargs
    .usage(
      'Usage:\n$0 [-f|-j] <config file | base URL> [--asciidoc|--html|--pdf] <output file>\nor\n$0 [-f|-j] <config file | base URL> <--multiple> files',
    )
    .example(
      '$0 -f config.json --html out',
      'Use a config file in current directory and write the result in file out.html',
    )
    .describe('f', 'Input type: JSON Config file (default)')
    .describe('j', 'Input type: Jira Base URL')
    .describe('asciidoc', 'Output type: asciidoc file')
    .describe('html', 'Output type: Html file')
    .describe('pdf', 'Output type: PDF file')
    .describe('multiple', 'Create multiple output files')
    .nargs('f', 1)
    .nargs('j', 1)
    .nargs('c', 1)
    .nargs('html', 1)
    .nargs('asciidoc', 1)
    .nargs('pdf', 1)
    .help('h')
    .alias('h', 'help')
    .alias('v', 'version').argv;

  if ((cli.f && !cli.j) || (!cli.f && cli.j)) {
    let myCredentials: Credentials;

    if (cli.f) {
      inputFormat = 'config';
      configFile = cli.f;
    } else if (cli.j) {
      inputFormat = 'jira';
      configFile = cli.j;
      try {
        myCredentials = await askInPrompt();
      } catch (err) {
        console.error(err.message);
      }
    }

    if (inputFormat === 'config') {
      if (cli.html) {
        outputFormat = 'html';
        outputFile = cli.html;
      } else if (cli.pdf) {
        outputFormat = 'pdf';
        outputFile = cli.pdf;
      } else if (cli.asciidoc) {
        outputFormat = 'asciidoc';
        outputFile = cli.asciidoc;
      } else if (cli._.length === 1) {
        outputFormat = 'asciidoc';
        outputFile = cli._[0];
      } else if (cli.multiple) {
        multiple = true;
        outputFile = cli.multiple;
      } else {
        console.error('Incorrect output definition, see --help for usage info');
      }

      if (
        (outputFormat && cli._.length < 1) ||
        (outputFormat === 'asciidoc' && cli._.length === 1)
      ) {
        console.log(
          'Input file type: ' +
            inputFormat +
            '\nOutput file type: ' +
            outputFormat +
            '\nConfig: ' +
            configFile +
            '\nOutput: ' +
            outputFile,
        );
        try {
          await doCompendium(configFile, outputFormat, outputFile);
        } catch (e) {
          console.error(chalk.red(e.message));
        }
      } else if (multiple) {
        console.log('Not implemented yet');
      } else {
        console.error('Found extra parameters: ' + cli._);
      }
    } else if (inputFormat === 'jira') {
      console.log('Not implemented yet');
    } else {
      console.error('Internal error with input format. Please try again.');
    }
  } else if (cli._.length === 2) {
    inputFormat = 'config';
    outputFormat = 'asciidoc';
    configFile = cli._[0];
    outputFile = cli._[1];
    console.log(
      'Input file type: ' +
        inputFormat +
        '\nOutput file type: ' +
        outputFormat +
        '\nConfig: ' +
        configFile +
        '\nOutput: ' +
        outputFile,
    );
    try {
      await doCompendium(configFile, outputFormat, outputFile);
    } catch (e) {
      console.error(chalk.red(e.message));
    }
  } else {
    console.error('Invalid input, see --help for usage info');
  }
})();
