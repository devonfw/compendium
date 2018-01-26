import * as fs from 'fs';
import { IndexSource, IndexNode, Index, TextInSources, Transcript, TextOut, Merger, DocConfig } from './types';
import { AsciiDocFileTextIn, AsciiDocFileTextOut } from './asciidoc';
import { HtmlFileTextOut } from './html';
import { MergerImpl } from './merger';
import { ConfigFile } from './config';

export async function doCompendium(configFile: string, format: string, outputFile: string | undefined) {

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
        const msg = 'Format \''+format+'\' is not implemented yet';
        throw new Error(msg);
    }

    // TextInSources
    let textinSources: TextInSources = {};
    for (const source of index[0]) {
        if (source.kind === 'asciidoc') {
            textinSources[source.key] = new AsciiDocFileTextIn(source.source); // The bind is by key -> A source identifier
        // } else if (source.kind === 'jira') {
        //     textinSources[source.key] = new TextInJira(source.source);
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
    } catch(e) {
        throw new Error(e);;
    }

}

function checkSourceValuesJSON(sourceJSON: any): boolean {

    if (sourceJSON.key && sourceJSON.key !== '' && sourceJSON.kind && (sourceJSON.kind === 'asciidoc' || sourceJSON.kind === 'jira')) { // ! Checking kind content isn't scalable
        return true;
    }

    return false;
};

function checkNodeValuesJSON(nodeJSON: any): boolean {

    if (nodeJSON.index && nodeJSON.index !== '') {
        return true;
    }

    return false;
}
