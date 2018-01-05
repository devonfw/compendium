
import * as config from './config';
import {DocConfig, TextOut} from './types';
import {DocConfigMock, TextOutMock} from './mocks/impl';
import {MergerImpl as Merger} from './merger';

let docconfig: DocConfig;
let textout: TextOut;

if (config.mock) {
    docconfig = new DocConfigMock();
    textout = new TextOutMock();
} else {
    throw new Error('Not implemented');
}

const merger = new Merger();
merger.merge(docconfig, textout);
