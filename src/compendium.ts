#!/usr/bin/env node

import chalk from 'chalk';
import { doCompendium } from './myApp';

let configFile, outputFile, multiple, outputFormat, inputFormat;

(async () => {

    const cli = require('yargs')
        .usage('Usaje:\n$0 [-f|-j|-c] <config file | base URL> [--html|--html|--pdf] <output file>\nor\n$0 [-f|-j|-c] <config file | base URL> <--multiple> files')
        .example('$0 -f config.json --html out', 'Use a config file in current directory and write the result in file out.html')
        .describe('f', 'Input type: JSON Config file (default)')
        .describe('j', 'Input type: Jira Base URL')
        .describe('c', 'Input type: Confluence base URL')
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
        .argv;
    if ((cli.f && !cli.j && !cli.c) || (!cli.f && cli.j && !cli.c) || (!cli.f && !cli.j && cli.c)) {

        if (cli.f) {
            inputFormat = 'config';
            configFile = cli.f;
        } else if (cli.j) {
            inputFormat = 'jira';
            configFile = cli.j;
        } else if (cli.c) {
            inputFormat = 'confluence';
            configFile = cli.c;
        }

        if (inputFormat === 'asciidoc') {
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

            if (outputFormat && cli._ < 1) {
                console.log('Input file type: ' + inputFormat + '\nOutput file type: ' + outputFormat + '\nConfig: ' + configFile + '\nOutput: ' + outputFile);
                try {
                    await doCompendium(configFile, outputFormat, outputFile); // Logic
                } catch (e) {
                    console.error(e.message);
                }
            } else if (multiple) {
                console.log('Not implemented yet');
            } else {
                console.error('Found extra parameters: ' + cli._);
            }

        } else if (inputFormat === 'confluence' || inputFormat === 'jira') {
            console.log('Not implemented yet');
        } else {
            console.error('Internal error with input format. Please try again.');
        }

    } else if (cli._.length === 2) {
        inputFormat = 'config';
        outputFormat = 'asciidoc';
        configFile = cli._[0];
        outputFile = cli._[1];
        console.log(cli._.length + '\n');
        console.log('Input file type: ' + inputFormat + '\nOutput file type: ' + outputFormat + '\nConfig: ' + configFile + '\nOutput: ' + outputFile);
        try {
            await doCompendium(configFile, outputFormat, outputFile); // Logic
        } catch (e) {
            console.error(e.message);
        }

    } else {
        console.error('Invalid input, see --help for usage info');
    }

})();
