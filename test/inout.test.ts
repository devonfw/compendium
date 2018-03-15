
import * as config from '../src/config';
import { DocConfig, TextOut, TextIn, Merger, Index, IndexSource, IndexNode, TextInSources, RichString } from '../src/types';
import { AsciiDocFileTextOut, AsciiDocFileTextIn } from '../src/asciidoc';
import { HtmlFileTextOut } from '../src/html';
import * as fs from 'fs';
import * as chai from 'chai';
import { ConfigFile } from '../src/config';
import { MergerImpl } from '../src/merger';
import * as chaiAsPromised from 'chai-as-promised';
import { TextInMock } from '../src/mocks/impl';

// tslint:disable-next-line:no-var-requires
chai.use(require('chai-fs'));
chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;

let merger: Merger;
let textin: TextIn;
let textinAsciidoc: TextIn;
let textinAsciidoc1: TextIn;
let textoutAsciidoc1: TextOut;
let textoutHtml1: TextOut;

const inputPath1 = 'src/mocks/input-data1';
const inputPath2 = 'src/mocks/input-data2';
const outputPath1 = 'test-data/output/result';

merger = new MergerImpl();
textin = new TextInMock('');
textinAsciidoc1 = new AsciiDocFileTextIn(inputPath1);
textinAsciidoc = new AsciiDocFileTextIn(inputPath2);
textoutAsciidoc1 = new AsciiDocFileTextOut(outputPath1);
textoutHtml1 = new HtmlFileTextOut(outputPath1);

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
    before(async () => {
        const transcript = await textinAsciidoc.getTranscript('brownfox2.adoc');
        const arrayTranscript = [];
        arrayTranscript.push(transcript);
        await textoutAsciidoc1.generate(arrayTranscript);
    });

    describe('AsciidocFileTextOut', () => {
        it('should show the content of the output file', (done) => {
            try{
                if (fs.existsSync(outputPath1 + '.adoc')) {
                    done();
                } else {
                    done(new Error('File was not created'));
                }
            } catch (error){
                done(error);
            }
        });
    });

    after(() => {
        // clean fixture
    });
});

describe('Testing if Asciidoc Output is the expected ', () => {
    before(async () => {
        const transcript = await textinAsciidoc.getTranscript('brownfox2.adoc');
        const arrayTranscript = [];
        arrayTranscript.push(transcript);
        await textoutAsciidoc1.generate(arrayTranscript);
    });

    describe('AsciidocFileTextOut', () => {
        it('should compare the 2 rich texts', (done) => {
            try {
                if (fs.existsSync(outputPath1 + '.adoc')) {

                    const outputStream = fs.readFileSync(outputPath1 + '.adoc', 'utf8');
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
            } catch (error){
                done(error);
            }
        });
    });
    describe('AsciidocFileTextOut', () => {
        it('should compare the table output', done => {
            try {
                if (fs.existsSync(outputPath1 + '.adoc')) {
                  const outputStream = fs.readFileSync(outputPath1 + '.adoc', 'utf8');
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
            } catch (error) {
                done(error);
            }
        });
    });

    after(() => {
        // clean fixture
    });
});

describe('Testing if HTML Output is the expected ', () => {
    before(async () => {
        const transcript = await textinAsciidoc.getTranscript('brownfox2.adoc');
        const arrayTranscript = [];
        arrayTranscript.push(transcript);
        await textoutHtml1.generate(arrayTranscript);
    });

    describe('HTMLFileTextOut', () => {
    it('should compare the 2 strings', done => {
        try {
            if (fs.existsSync(outputPath1 + '.html')) {
            const outputStream = fs.readFileSync(outputPath1 + '.html', 'utf8');
            const outputArray = outputStream.split('\n');
            if (outputArray) {
                expect(outputArray[25]).equals('<p>The <sub>quick</sub> <strong>brown fox</strong> <strong><em>jumps</em></strong> <strong>over</strong> the lazy <span class="underline">dog.</span></p>');
                done();
            } else {
                done(new Error('Incorrect content'));
            }
            } else {
            done(new Error('File was not created'));
            }
        } catch (error) {
            done(error);
        }
    });
});
    after(() => {
    // clean fixture
    });
});

describe('Testing the Html Output stream and the file creation ', () => {
    before(async () => {
        const transcript = await textinAsciidoc.getTranscript('brownfox2.adoc');
        const arrayTranscript = [];
        arrayTranscript.push(transcript);
        await textoutHtml1.generate(arrayTranscript);
    });

    describe('HtmlFileTextOut', () => {
        it('should show the content of the output file', (done) => {
           try {
                if (expect(fs.existsSync(outputPath1 + '.html'))) {
                    done();
                } else {
                    done(new Error('File was not created'));
                }
            } catch (error) {
                done(error);
            }
        });
    });

    after(() => {
        // clean fixture
    });
});

describe('Testing the merge of two files ', () => {
    before(() => {
    });

    describe('Merge', () => {
        it('should combine 2 asciidoc in one', (done) => {

            const sources: IndexSource[] = [{
                key: 'input-data1',
                kind: 'asciidoc',
                source: 'src/mocks/input-data1',
            },
            {
                key: 'input-data2',
                kind: 'asciidoc',
                source: 'src/mocks/input-data2',
            }];

            const nodes: IndexNode[] = [{
                key: 'input-data1',
                index: 'brownfox.adoc',
            },
            {
                key: 'input-data2',
                index: 'brownfox2.adoc',
                sections: [''],
            }];

            const index: Index = [sources, nodes];

            const textinsources: TextInSources = {};

            textinsources['input-data1'] = new AsciiDocFileTextIn('src/mocks/input-data1');
            textinsources['input-data2'] = new AsciiDocFileTextIn('src/mocks/input-data2');

            const merger1 = new MergerImpl();
            const textoutMerger: TextOut = new AsciiDocFileTextOut('test-data/output/mergerResult');

            merger1.merge(textinsources, index, textoutMerger).then(() => {

                if (expect(fs.existsSync('test-data/output/mergerResult.adoc'))) {
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

describe ('Testing the IR', () => {
    before (() => {

    });

    describe ('IR', () => {
        it('should return the Transcript from the external source', (done) => {
            textinAsciidoc1.getTranscript('brownfox.adoc').then((transcript) => {
            const h2 = transcript.segments[2];
            const p = transcript.segments[3];
            if (h2.kind === 'textelement' && p.kind === 'paragraph') {
                const richText = h2.text[0];
                if ((richText as RichString)) {
                    const richString = (richText as RichString);
                    expect(richString.text).equals('The cat');
                } else {
                    done(new Error('Expected RichString, received InlineImage'));
                }
                const richText2 = p.text[1];
                if ((richText2 as RichString)){
                    const richString2 = (richText2 as RichString);
                    expect(richString2.attrs.strong).equals(true);
                    done();
                }else {
                    done (new Error('Expected RichString, received Table'));
                }
            } else {
                done(new Error('Not a valid h2 element'));
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