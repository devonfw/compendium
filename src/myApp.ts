import * as fs from 'fs';
import { IndexSource, IndexNode, Index, TextInSources, Transcript, TextOut, Merger } from './types';
import { AsciiDocFileTextIn, AsciiDocFileTextOut } from './asciidoc';
import { HtmlFileTextOut } from './html';
import { MergerImpl } from './merger';

export function doCompendium(configFile: string, format: string, outputFile: string | undefined) {

    console.log('\n\n=> Parameters: \n');
    console.log(' Configuration file: ', configFile);
    console.log(' Output format: ', format);
    console.log(' Output file: ', outputFile);

    // PART I: Read the JSON file config and generate the index
    // --------------------------------------------------------

    const config = fs.readFileSync(configFile, 'utf8');
    const data = JSON.parse(config);
    let fileOutput: TextOut;
    let merger: Merger = new MergerImpl();
    let output = 'result';

    if (outputFile) {
        output = outputFile;
    }

    // Sources
    let indexSources: IndexSource[] = [];
    for (const source of data.sources) {
        if (checkSourceValuesJSON(source)) {

            const indexSource: IndexSource = {
                key: source.key,
                kind: source.kind,
                source: source.source
            };
            indexSources.push(indexSource);
        } else {
            throw new Error('JSON: Some sources have not a valid property/value');
        }
    }

    // Nodes
    let indexNodes: IndexNode[] = [];
    for (const node of data.nodes) {
        if (checkNodeValuesJSON(node)) {

            const indexNode: IndexNode = {
                key: node.key,
                kind: node.kind,
                index: node.index
            };
            indexNodes.push(indexNode);
        } else {
            throw new Error('JSON: Some nodes have not a valid property/value');
        }
    }

    // Index
    const index: Index = [indexSources, indexNodes];

    if (format === 'asciidoc') {
        fileOutput = new AsciiDocFileTextOut(output);
    } else if (format === 'html') {
        fileOutput = new HtmlFileTextOut(output);
    } else {
        fileOutput =  new AsciiDocFileTextOut(output);
    }
    // ----

    // Complementary functions for part I


    // PART II: Checking TextinSources
    // --------------------------------

    // Instantiating TextInSources
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
    
    try {
    merger.merge(textinSources, index, fileOutput).then(() => {
        console.log('COMPENDIUM CREATED!!!');
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
