
import * as config from './config';
import {DocConfig, TextOut, TextInSources, IndexSource} from './types';
import {DocConfigMock, TextOutMock, TextInMock} from './mocks/impl';
import {MergerImpl as Merger} from './merger';
import { AsciiDocFileTextIn } from './asciidoc';

let docconfig: DocConfig;
let textout: TextOut;
const textinSources: TextInSources = {};

(async () => {

    if (config.mock) {
        docconfig = new DocConfigMock();
        textout = new TextOutMock();
    } else {
        throw new Error('Not implemented');
    }
    const index = await docconfig.getIndex();
    for (const source of index[0]){
        if (source.kind === 'asciidoc') {
            textinSources[source.key] = new AsciiDocFileTextIn(source.source); // The bind is by key -> A source identifier
        } else if (source.kind === 'jira') {
            //textinSources[source.key] = new TextInJira(source.source);
        } else {
            throw new Error('Unknown TextInSource');
        }
    }

    const merger = new Merger();
    await merger.merge(textinSources, index, textout);

})();