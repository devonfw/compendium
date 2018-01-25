#!/usr/bin/env node

import * as commander from 'commander';
import chalk from 'chalk';
import { doCompendium } from './myApp';

let outputFile: string | undefined;

commander
    .version('1.0.0')
    .description('A composition of concise but detailed information about a particular subject obtained from different sources - Github wiki, asciidoc files, Jira, Confluence, etc. - with the aim to be published in a single document, book or other publication.')
    .option('-f, --config <confile>', 'Indicates that config source is file')
    .option('--asciidoc, --asciidoc', 'Output file in asciidoc')
    .option('--html, --html', 'Output file in html')
    .option('--pdf, --pdf', 'Output file in pdf')
    .arguments('<output>')
    .action(function (output: string) {
        outputFile = output;
    });

commander.on('--help', help);

commander.parse(process.argv);


// Arguments Checker
if (typeof outputFile === 'undefined') {
    console.error('\n error: output file missing'); // Traditional error (like commander)
    //console.error(` ${chalk.red('Error!')} output file missing`); // Customized error
    showHelpWhenError();
    process.exit(1);
}

// Option checker: Only one output format is allow.
if ((typeof commander.asciidoc === 'boolean' && typeof commander.html === 'boolean') ||
    (typeof commander.asciidoc === 'boolean' && typeof commander.pdf === 'boolean') ||
    (typeof commander.html === 'boolean' && typeof commander.pdf === 'boolean')) {

    console.error('\n error: too many output options defined'); // Traditional error (like commander)
    //console.error(` ${chalk.red('Error!')} too many output options defined`); // Customized error
    showHelpWhenError();
    process.exit(1);
}

// Optional check: More arguments than required (Rude version)
if (process.argv.length > 6) { // 6 ->[node, compendium, -f, config, -format, output]
    console.error('\n error: too many arguments'); // Traditional error (like commander)
    //console.error(` ${chalk.red('Error!')} too many arguments`); // Customized error
    showHelpWhenError();
    process.exit(1);
}


// Defaults // NO LONGER NECESSARY
// let defaultOutput = false;
// if (typeof commander.asciidoc === 'undefined' || typeof commander.html === 'undefined' || typeof commander.pdf === 'undefined') {
//     defaultOutput = true;
// }


// Output format
let outputFormat = 'asciidoc';

if (commander.asciidoc) {
    outputFormat = 'asciidoc';
} else if (commander.html) {
    outputFormat = 'html';
} else if (commander.pdf) {
    outputFormat = 'pdf';
}

// --------------------

// Logic
function logError(err:any) {
    if (err) {
        switch (typeof err) {
            case 'string':
                console.log(` ${chalk.red('Error!')} ${err}`);
                break;
            case 'object':
                if (err.message) {
                    console.log(` ${chalk.red('Error!')} ${err.message}`)
                    break;
                }
            default:
                console.log(` ${chalk.red('Error!')}\n  ${err}`);
        }
    } else {
        showHelpWhenError();
    }
}

//function doThings(config:string, format:string, output:string|undefined) { // An output variable typeof undefined never gets here

    try {

        doCompendium(commander.config, outputFormat, outputFile); // Logic

    } catch (e) {
        logError(e)
    }
//}

//doThings(commander.config, outputFormat, outputFile);



// Extra
// --------------------

function help() {

    console.log(` 
    
    -> Customized usage:           
    
    compendium  [-f] <<config/index source>> [--asciidoc|--html|--pdf] <<output doc>>
    
        -f         - default. Indicates that config source is file (only option in MVP)
        --asciidoc – default. Indicates that output doc is in asciidoc format 
        --html     – output doc in html
        --pdf      – output doc in pdf (not in MVP)
    
        Example:
        
        compendium  –html  c:\\temp\\trsc-asd.json  c:\\temp\\output\\trsc-design-document.html
        
        `);
}

function showHelpWhenError() {

    console.log(` 
    
    Usage:           
    
    compendium  [-f] <<config/index source>> [--asciidoc|--html|--pdf] <<output doc>>
    
        -f         - default. Indicates that config source is file (only option in MVP)
        --asciidoc – default. Indicates that output doc is in asciidoc format 
        --html     – output doc in html
        --pdf      – output doc in pdf (not in MVP)
    
        Example:
        
        compendium  –html  c:\\temp\\trsc-asd.json  c:\\temp\\output\\trsc-design-document.html
        
        `);
}
