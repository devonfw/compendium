
import * as config from './config';
import {DocConfig, TextOut, TextInSources, IndexSource} from './types';
import {DocConfigMock, TextOutMock, TextInMock} from './mocks/impl';
import {MergerImpl as Merger} from './merger';

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
        if (source.kind === 'asciidoc'){
            // tslint:disable-next-line:no-string-literal
            textinSources['asciidoc'] = new TextInMock(source.source);
        } else {
            throw new Error('Unknown TextInSource');
        }
    }

    const merger = new Merger();
    await merger.merge(textinSources, index, textout);

})();