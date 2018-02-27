
import * as config from '../src/config';
import { DocConfig, TextOut, TextIn, Merger, Index, IndexSource, IndexNode, TextInSources, RichString } from '../src/types';
import { AsciiDocFileTextOut, AsciiDocFileTextIn } from '../src/asciidoc';
import { HtmlFileTextOut } from '../src/html';
import * as fs from 'fs';
import * as chai from 'chai';
import { ConfigFile } from '../src/config';
import { MergerImpl } from '../src/merger';
import { assert } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { TextInMock } from '../src/mocks/impl';

chai.use(require('chai-fs')); // It has no types
chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;

// Per user configuration (for now; in the upcoming version path will be relatives)

// Path
const pathBaseJURUBIOG = 'C:/Projects/Compendium/compendium';
const pathBaseSBADENES = 'C:/Users/sbadenes/Desktop/Compendium/compendium';
const pathBaseAREDOMAR = 'C:/Users/aredomar/Desktop/repos/compendium';

const pathBase = pathBaseSBADENES;

let merger: Merger;
let textin: TextIn;
let textinAsciidoc: TextIn;
let textoutAsciidoc1: TextOut;
let textoutAsciidoc2: TextOut;
let textoutHtml1: TextOut;
let textoutHtml2: TextOut;

const inputPath = 'test-data/input';
const outputPath1 = 'test-data/output/output1';
const outputPath2 = 'test-data/output/output2';
const ouputFilename1 = 'output1';
const outputFilename2 = 'output2';

merger = new MergerImpl();
textin = new TextInMock('');
textinAsciidoc = new AsciiDocFileTextIn(inputPath);
textoutAsciidoc1 = new AsciiDocFileTextOut(outputPath1);
textoutAsciidoc2 = new AsciiDocFileTextOut(outputPath2);
textoutHtml1 = new HtmlFileTextOut(outputPath1);
textoutHtml2 = new HtmlFileTextOut(outputPath2);


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
                    const richText = h1.text[0];
                    if ((richText as RichString)) {
                        const richString = (richText as RichString);
                        expect(richString.text).equals('The fox');
                        done();
                    } else {
                        done(new Error('Expected RichString, received InlineImage'));
                    }
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
        const ouput = 'test-data/output/output1.adoc';
        if (fs.existsSync(ouput)) {
            fs.unlinkSync(ouput);
        }
    });

    describe('AsciidocFileTextOut', () => {
        it('should show the content of the output file', (done) => {
            textinAsciidoc.getTranscript('brownfox2.adoc').then((transcript) => {
                let arrayTranscript = [];
                arrayTranscript.push(transcript);
                textoutAsciidoc1.generate(arrayTranscript).then(() => {
                    expect('test-data/output/output1.adoc').to.be.a.file('output1.adoc was not created');
                    done();
                }).catch((error) => {
                    done(error);
                });
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
        const ouput = 'test-data/output/output2.adoc';
        if (fs.existsSync(ouput)) {
            fs.unlinkSync(ouput);
        }
    });

    describe('AsciidocFileTextOut', () => {
        it('should compare the 2 rich texts', (done) => {
            textinAsciidoc.getTranscript('brownfox2.adoc').then((transcript) => {
                let arrayTranscript = [];
                arrayTranscript.push(transcript);
                textoutAsciidoc2.generate(arrayTranscript);
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
    describe('AsciidocFileTextOut', () => {
        it('should compare the table output', done => {
            textinAsciidoc.getTranscript('brownfox2.adoc').then(transcript => {
                let arrayTranscript = [];
                arrayTranscript.push(transcript);
                textout.generate(arrayTranscript);
                if (fs.existsSync('result.adoc')) {
                  const outputStream = fs.readFileSync('result.adoc', 'utf-8');
                  const outputArray = outputStream.split('\n');
                  if (outputArray) {
                    expect(outputArray[16]).equals('| 4 | Item 4 | link:http://www.google.es[Google] ');
                    done();
                  } else {
                    done(new Error('Incorrect content'));
                  }
                } else {
                  done(new Error('File was not created'));
                }
            }).catch(error => {
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
          textoutHtml2.generate(arrayTranscript);
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
        const ouput = 'test-data/output/output1.html';
        if (fs.existsSync(ouput)) {
            fs.unlinkSync(ouput);
        }
    });

    describe('HtmlFileTextOut', () => {
        it('should show the content of the output file', (done) => {
            textinAsciidoc.getTranscript('brownfox2.adoc').then((transcript) => {
                const arrayTranscript = [];
                arrayTranscript.push(transcript);
                textoutHtml1.generate(arrayTranscript).then(() => {
                    expect('test-data/output/output1.html').to.be.a.file('output1.html was not created');
                    done();
                }).catch((error) => {
                    done(error);
                });
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
        const ouput = 'test-data/output/mergedOutput.adoc';
        if (fs.existsSync(ouput)) {
            fs.unlinkSync(ouput);
        }
    });

    describe('Merge', () => {
        it('should combine 2 asciidoc in one', (done) => {

            let sources: IndexSource[] = [{
                    key: 'input-data1',
                    kind: 'asciidoc',
                source: pathBase + './src/mocks/input-data1'
                },
                {
                    key: 'input-data2',
                    kind: 'asciidoc',
                    source: pathBase + './src/mocks/input-data2'
            }];

            let nodes: IndexNode[] = [{
                key: 'input-data1',
                index: 'brownfox.adoc'
            },
            {
                key: 'input-data2',
                index: 'brownfox2.adoc',
                sections: ['']
            }];

            const index: Index = [sources, nodes];
            const textinsources: TextInSources = {};

            textinsources['input-data1'] = new AsciiDocFileTextIn(pathBase + '/src/mocks/input-data1');
            textinsources['input-data2'] = new AsciiDocFileTextIn(pathBase + '/src/mocks/input-data2');

            const textoutMerger: TextOut = new AsciiDocFileTextOut('test-data/output/mergedOutput');

            merger.merge(textinsources, index, textoutMerger).then(() => {
                expect('test-data/output/mergedOutput.adoc').to.be.a.file('Files haven\'t been merged. Output \'mergedOutput.adoc\' hasn\'t been created.');
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