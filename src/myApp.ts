import * as fs from 'fs';
import { IndexSource, IndexNode, Index, TextInSources, Transcript, TextOut, Merger, DocConfig, Cookie, Cookies } from './types';
import { AsciiDocFileTextIn, AsciiDocFileTextOut } from './asciidoc';
import { HtmlFileTextOut } from './html';
import { MergerImpl } from './merger';
import { ConfigFile } from './config';
import { ConfluenceTextIn } from './confluence';

export interface Credentials {
    username: string;
    password: string;
}

export async function doCompendium(configFile: string, format: string, outputFile: string | undefined) {

    // Mock Data
    const brandNewDayProdCookie: Cookie = { name: 'brandNewDayProd', value: 'AQIC5wM2LY4SfcxV8-VgMyIWyq_IgeQTSr7FEv3Pk3YLncA.*AAJTSQACMDMAAlNLABQtODMzOTE5MDQ1ODczOTE0MTY1NgACUzEAAjAx*' };

    const cookiesMock: Cookies = [brandNewDayProdCookie];

    console.log('\n\n=> Parameters: \n');
    console.log(' Configuration file: ', configFile);
    console.log(' Output format: ', format);
    console.log(' Output file: ', outputFile);
    console.log('\n');

    let docconfig: ConfigFile;
    let fileOutput: TextOut;
    let merger: Merger;

    // Get Index
    docconfig = new ConfigFile(configFile);
    const index = await docconfig.getIndex();

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
            textinSources[source.key] = new ConfluenceTextIn(source.source, source.space, cookiesMock);
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
