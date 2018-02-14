import { COOKIES_TEST, isConfluenceTest } from './mocks/confluence/auth';
import * as fs from 'fs';
import { IndexSource, IndexNode, Index, TextInSources, Transcript, TextOut, Merger, DocConfig, Cookie, Cookies, Credentials } from './types';
import { AsciiDocFileTextIn, AsciiDocFileTextOut } from './asciidoc';
import { HtmlFileTextOut } from './html';
import { MergerImpl } from './merger';
import { ConfigFile } from './config';
import { ConfluenceTextIn } from './confluence';
import chalk from 'chalk';

export async function doCompendium(configFile: string, format: string, outputFile: string | undefined) {

    let docconfig: ConfigFile;
    let fileOutput: TextOut;
    let merger: Merger;
    let index;

    // Get Index
    docconfig = new ConfigFile(configFile);
    try {
        index = await docconfig.getIndex();
    } catch (err) {
        throw new Error(err.message);
    }

    // Test Out
    let output = 'result';
    if (outputFile) {
        output = outputFile;
    }

    if (format === 'asciidoc') {
        fileOutput = new AsciiDocFileTextOut(output);
    } else if (format === 'html') {
        fileOutput = new HtmlFileTextOut(output);
    } else {
        const msg = 'Format \'' + format + '\' is not implemented yet';
        throw new Error(msg);
    }

    // TextInSources
    let textinSources: TextInSources = {};
    for (const source of index[0]) {
        if (source.kind === 'asciidoc') {
            textinSources[source.key] = new AsciiDocFileTextIn(source.source); // The bind is by key -> A source identifier
        } else if (source.kind === 'confluence') {
            if (source.context === 'capgemini') {
                if (isConfluenceTest) {
                    textinSources[source.key] = new ConfluenceTextIn(source.source, source.space, COOKIES_TEST);
                } else {
                    // Here is where credentials are request to call our external service to obtain the cookies
                    throw new Error('Resource under \'Single Sign On\' context. This authentication is not yet implemented.');
                }
            } else {
               
                let credentials: Credentials;
                try {
                    console.log(chalk.bold(`Please enter credentials for source with key '${chalk.green.italic(source.key)}' (${chalk.blue(source.source)})\n`));
                    credentials = await askInPrompt();
                    textinSources[source.key] = new ConfluenceTextIn(source.source, source.space, credentials);
                } catch (err) {
                    throw new Error(err.message);
                }
            }
        } else {
            throw new Error('Unknown TextInSource');
        }
    }

    // Merger
    merger = new MergerImpl();
    try {
        merger.merge(textinSources, index, fileOutput).then(() => {
            console.log('\n Process finished!'); // ! This is always shown. Although errors occurr.
        });
    } catch (e) {
        console.error(e.message);
    }

}

export async function askInPrompt(): Promise<Credentials> {
    let prompt = require('prompt');
    let credentials: Credentials;

    const promise = new Promise<Credentials>((resolve, reject) => {

        prompt.start();

        prompt.get([{
            name: 'username',
            required: true,
        }, {
            name: 'password',
            hidden: true,
            replace: '*',
            required: true,

        }], (err: any, result: any) => {
            credentials = {
                username: result.username,
                password: result.password,
            };
            if (credentials) {
                resolve(credentials);
            } else {
                reject(err.message);
            }
        });

    });

    return promise;
}
