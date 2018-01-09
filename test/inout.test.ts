
import * as config from '../src/config';
import {DocConfig, TextOut, TextIn} from '../src/types';
import {DocConfigMock, TextOutMock, TextInMock} from '../src/mocks/impl';
import { AsciiDocFileTextOut, AsciiDocFileTextIn } from '../src/asciidoc';
import * as fs from 'fs';
import * as chai from 'chai';

let docconfig: DocConfig;
let textout: TextOut;
let textin: TextIn;
let textinAsciidoc: TextIn;

const expect = chai.expect;
const should = chai.should();

if (config.mock) {
    docconfig = new DocConfigMock();
    // textout = new TextOutMock();
    textout = new AsciiDocFileTextOut();
    textin = new TextInMock('path');
    textinAsciidoc = new AsciiDocFileTextIn('test-data');

} else {
    throw new Error('Not implemented');
}

describe('Testing the Input of Text and doc generation', () => {
    before(() => {
        //setup fixture
    });

    describe('TextIn', () => {
        it('should return the Transcript from the external source', (done) => {
            textin.getTranscript('test-data/brownfox.adoc').then((transcript) => {
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

describe('Testing the Output stream and the file creation ', () => {
    before(() => {
        //setup fixture
    });

    describe('AsciidocFileTextOut', () => {
        it('should show the content of the output file', (done) => {
            textin.getTranscript('test-data/brownfox.adoc').then((transcript) => {
                let arrayTranscript = [];
                arrayTranscript.push(transcript);
                textout.generate(arrayTranscript);
                if (expect(fs.existsSync('result.asciidoc'))) {

                    done();
                } else {
                    done(new Error('File was not created'));
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

describe('Testing the read stream of the source file ', () => {
    before(() => {
        //setup fixture
    });

    describe('AsciidocFileTextIn', () => {
        it('should show asciidoc and html parse of source file', (done) => {
            textinAsciidoc.getTranscript('brownfox2.adoc').then((transcript) => {
                    done();
            }).catch((error) => {
                done(error);
            });
        });
    });

    after(() => {
        // clean fixture
    });
});