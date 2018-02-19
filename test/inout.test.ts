
import * as config from '../src/config';
import { DocConfig, TextOut, TextIn, Merger, Index, IndexSource, IndexNode, TextInSources } from '../src/types';
import {DocConfigMock, TextOutMock, TextInMock} from '../src/mocks/impl';
import { AsciiDocFileTextOut, AsciiDocFileTextIn } from '../src/asciidoc';
import { HtmlFileTextOut } from '../src/html';
import * as fs from 'fs';
import * as chai from 'chai';
import { ConfigFile } from '../src/config';
import { MergerImpl } from '../src/merger';
import { assert } from 'chai';

let docconfigmock: DocConfig;
let docconfig: ConfigFile;
let textout: TextOut;
let textoutHtml: TextOut;
let textin: TextIn;
let textinAsciidoc: TextIn;
let merger: Merger;

const expect = chai.expect;
const should = chai.should();

if (config.mock) {
    docconfigmock = new DocConfigMock();
    // textout = new TextOutMock();
    textin = new TextInMock('path');
} else {
    docconfig = new ConfigFile('../compendium/src/mocks/configMock.json');
    textout = new AsciiDocFileTextOut('result');
    textoutHtml = new HtmlFileTextOut('result');
    textinAsciidoc = new AsciiDocFileTextIn('test-data');
    merger = new MergerImpl();
}

xdescribe('Testing the Input of Text and doc generation', () => {
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

describe('Testing the Asciidoc Input and Output stream and the file creation ', () => {
    before(() => {
        //setup fixture
    });

    describe('AsciidocFileTextOut', () => {
        it('should show the content of the output file', (done) => {
            textinAsciidoc.getTranscript('brownfox2.adoc').then((transcript) => {
                let arrayTranscript = [];
                arrayTranscript.push(transcript);
                textout.generate(arrayTranscript);
                if (fs.existsSync('result.adoc')) {
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

describe('Testing if Asciidoc Output is the expected ', () => {
    before(() => {
        //setup fixture
    });

    describe('AsciidocFileTextOut', () => {
        it('should compare the 2 strings', (done) => {
            textinAsciidoc.getTranscript('brownfox2.adoc').then((transcript) => {
                let arrayTranscript = [];
                arrayTranscript.push(transcript);
                textout.generate(arrayTranscript);
                if (fs.existsSync('result.adoc')) {

                    const outputStream = fs.readFileSync('result.adoc', 'utf-8');
                    const outputArray = outputStream.split('\n');
                    if (outputArray) {
                        expect(outputArray[9]).equals('The ~quick~ *brown fox* *_jumps_* *over* the lazy [.underline]#dog.#');
                        done();
                    } else {
                        done(new Error('Incorrect content'));
                    }
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

describe('Testing if HTML Output is the expected ', () => {
  before(() => {
    //setup fixture
  });

  describe('HTMLFileTextOut', () => {
    it('should compare the 2 strings', done => {
      textinAsciidoc
        .getTranscript('brownfox2.adoc')
        .then(transcript => {
          let arrayTranscript = [];
          arrayTranscript.push(transcript);
          textoutHtml.generate(arrayTranscript);
          if (fs.existsSync('result.html')) {
            const outputStream = fs.readFileSync('result.html', 'utf-8');
            const outputArray = outputStream.split('\n');
            if (outputArray) {
              expect(outputArray[21]).equals('<p>The <sub>quick</sub> <strong>brown fox</strong> <strong><em>jumps</em></strong> <strong>over</strong> the lazy <span class="underline">dog.</span></p>');
              done();
            } else {
              done(new Error('Incorrect content'));
            }
          } else {
            done(new Error('File was not created'));
          }
        })
        .catch(error => {
          done(error);
        });
    });
  });

  after(() => {
    // clean fixture
  });
});

describe('Testing the Html Output stream and the file creation ', () => {
    before(() => {
        //setup fixture
    });

    describe('HtmlFileTextOut', () => {
        it('should show the content of the output file', (done) => {
            textinAsciidoc.getTranscript('brownfox2.adoc').then((transcript) => {
                const arrayTranscript = [];
                arrayTranscript.push(transcript);
                textoutHtml.generate(arrayTranscript);
                if (expect(fs.existsSync('result.html'))) {
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

describe('Testing the merge of two files ', () => {
    before(() => {
        //setup fixture
    });

    describe('Merge', () => {
        it('should combine 2 asciidoc in one', (done) => {

            let sources: IndexSource[] = [{
                    key: 'input-data1',
                    kind: 'asciidoc',
                    source: './src/mocks/input-data1'
                },
                {
                    key: 'input-data2',
                    kind: 'asciidoc',
                    source: './src/mocks/input-data2'
            }];

            let nodes: IndexNode[] = [{
                key: 'input-data1',
                kind: 'asciidoc',
                index: 'brownfox.adoc'
            },
            {
                key: 'input-data2',
                kind: 'asciidoc',
                index: 'brownfox2.adoc',
                sections: ['']
            }];

            const index: Index = [sources, nodes];

            let textinsources: TextInSources = {};

            textinsources['input-data1'] = new AsciiDocFileTextIn('C:/Users/aredomar/Desktop/repos/compendium/src/mocks/input-data1');
            textinsources['input-data2'] = new AsciiDocFileTextIn('C:/Users/aredomar/Desktop/repos/compendium/src/mocks/input-data2');

            const merger = new MergerImpl();
            let textoutMerger: TextOut = new AsciiDocFileTextOut('mergerResult');

            merger.merge(textinsources, index, textoutMerger).then(() => {

                if (expect(fs.existsSync('resultMerger.adoc'))) {
                    done();
                } else {
                    done(new Error('Files haven\'t been merged'));
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

describe('Testing the config and index creation', () => {
    before(() => {
        //setup fixture
    });

    describe('ConfigFile', () => {
        it('should show ', (done) => {
            docconfig.getIndex().then((index) => {

                assert.isArray(index, 'Index must be an array');
                assert.isArray(index[0], 'Souces must be an array');
                assert.isArray(index[1], 'Nodes must be an array');

                expect(index[0]).have.lengthOf(2, 'There are two sources');
                expect(index[1]).have.lengthOf(2, 'There are two nodes');

                expect(index[0][0].key).equals('input-data1');
                expect(index[0][0].kind).equals('asciidoc');
                expect(index[0][0].source).equals('./src/mocks/input-data1');

                expect(index[0][1].key).equals('input-data2');
                expect(index[0][1].kind).equals('asciidoc');
                expect(index[0][1].source).equals('./src/mocks/input-data2');

                expect(index[1][0].key).equals('input-data1');
                expect(index[1][0].kind).equals('asciidoc');
                expect(index[1][0].index).equals('brownfox.adoc');

                expect(index[1][1].key).equals('input-data2');
                expect(index[1][1].kind).equals('asciidoc');
                expect(index[1][1].index).equals('brownfox2.adoc');

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

describe('Testing the read stream of the source file ', () => {
    before(() => {
        //setup fixture
    });

    describe('AsciidocFileTextIn', () => {
        it('should show asciidoc and html parse of source file', (done) => {
            textinAsciidoc.getTranscript('brownfox.adoc').then((transcript) => {
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