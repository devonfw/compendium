#!/usr/bin/env node

import * as commander from 'commander';
import chalk from 'chalk';
import { doCompendium } from './myApp';

let configFile: string | undefined;
let outputFile: string | undefined;
let configFromFile = false;
let outputFormat = 'asciidoc';

(async () => {

    commander
        .version('0.0.9')
        .description('A composition of concise but detailed information about a particular subject obtained from different sources - Github wiki, asciidoc files, Jira, Confluence, etc. - with the aim to be published in a single document, book or other publication.')
        .option('-f, --config', 'indicates that config source is file')
        .option('--asciidoc, --asciidoc', 'output file in asciidoc')
        .option('--html, --html', 'output file in html')
        .option('--pdf, --pdf', 'output file in pdf')
        .arguments('<confile> [output]')
        .action(function (confile:string, output: string) {
            configFile = confile;
            outputFile = output;
        });
    
    commander.on('--help', showExamples);
    
    commander.parse(process.argv);

    
    // Argument checker 1: Configuration File
    if (typeof configFile === 'undefined') {
        console.error('\n error: configuration file missing'); // Traditional error (like commander)
        // console.error(` ${chalk.red('Error!')} configuration file missing`); // Customized error
        commander.help();
        process.exit(1);
    }
    
    // // Argument checker 2: Output File
    // if (typeof outputFile === 'undefined') {
    //     console.error('\n error: output file missing'); // Traditional error (like commander)
    //     // console.error(` ${chalk.red('Error!')} output file missing`); // Customized error
    //     commander.help();
    //     process.exit(1);
    // }
    
    // Option checker 1: Only one output format is allow.
    if ((typeof commander.asciidoc === 'boolean' && typeof commander.html === 'boolean') ||
        (typeof commander.asciidoc === 'boolean' && typeof commander.pdf === 'boolean') ||
        (typeof commander.html === 'boolean' && typeof commander.pdf === 'boolean')) {
    
        console.error('\n error: too many output formats defined'); // Traditional error (like commander)
        //console.error(` ${chalk.red('Error!')} too many output options defined`); // Customized error
        commander.help();
        process.exit(1);
    }
    
    // Optional checker 2: More arguments than required (Rude version) // TO IMPROVE
    if (process.argv.length > 6) { // 6 ->[node, compendium, -f, config, -format, output]
        console.error('\n error: too many arguments'); // Traditional error (like commander)
        // console.error(` ${chalk.red('Error!')} too many arguments`); // Customized error
        commander.help();
        process.exit(1);
    }
    
    // Assignments of options 1: Config from file
    if (commander.config) {
        configFromFile = true;
    }
    
    // Assignments of options 2: Output format
    if (commander.asciidoc) {
        outputFormat = 'asciidoc';
    } else if (commander.html) {
        outputFormat = 'html';
    } else if (commander.pdf) {
        outputFormat = 'pdf';
    }
    
    // Logic
    if (configFile){
        try {
            await doCompendium(configFile, outputFormat, outputFile); // Logic
        } catch (e) {
            logError(e)
        }
    } else {
        console.error('\n error: there are arguments missing'); // Traditional error (like commander)
        // console.error(` ${chalk.red('Error!')} there are arguments missing`); // Customized error
        commander.help();
        process.exit(1);
    }
})();

function logError(err: any) {
    if (err) {
        switch (typeof err) {
            case 'string':
                console.log(`\n ${chalk.red('Error!')} ${err}`);
                break;
            case 'object':
                if (err.message) {
                    console.log(`\n ${chalk.red('Error!')} ${err.message}`)
                    break;
                }
            default:
                console.log(`\n ${chalk.red('Error!')}\n  ${err}`);
        }
    } else {
        commander.help();
    }
}

function showExamples() {

    console.log(`

    Examples:
    
        $ compendium  c:\\temp\\trsc-asd.json  c:\\temp\\output\\trsc-design-document.adoc

        $ compendium  –f  c:\\temp\\trsc-asd.json --html c:\\temp\\output\\trsc-design-document.html

        $ compendium  –f  config.json  --asciidoc output.adoc

        $ compendium  config.json --pdf output
        
        `);
}

function showCustomizedHelp() {    // NOT USED

    console.log(` 
    
    Usage:           
    
    compendium  [-f] <<config/index source>> [--asciidoc|--html|--pdf] <<output doc>>
    
        -f         - default. Indicates that config source is file (only option in MVP)
        --asciidoc – default. Indicates that output doc is in asciidoc format 
        --html     – output doc in html
        --pdf      – output doc in pdf (not in MVP)
    
        `);
}
