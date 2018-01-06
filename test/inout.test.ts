
import * as config from '../src/config';
import {DocConfig, TextOut, TextIn} from '../src/types';
import {DocConfigMock, TextOutMock, TextInMock} from '../src/mocks/impl';
import * as chai from 'chai';

let docconfig: DocConfig;
let textout: TextOut;
let textin: TextIn;

const expect = chai.expect;
const should = chai.should();

if (config.mock) {
    docconfig = new DocConfigMock();
    textout = new TextOutMock();
    textin = new TextInMock('path');

} else {
    throw new Error('Not implemented');
}

describe('Testing the Input of Text and doc generation', () => {
    before(() => {
        //setup fixture
    });

    describe('TextIn', () => {
        it('should return the Transcript from the external source', (done) => {
            textin.getTranscript('test-data/brownfox.md').then((transcript) => {
                    const h1 = transcript.segments[0];
                    const p = transcript.segments[1];
                    if (h1.kind === 'textelement'){
                        expect(h1.element).equals('h1');
                        expect(h1.text).equals('The fox');
                        done();
                    } else {
                        done(new Error('Not a valid h1 element'));
                    }
            }).catch((error) => {
                done(error);
            });
        });
    });

    after(() => {
        // clean fixture
    });
});