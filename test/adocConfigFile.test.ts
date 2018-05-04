import * as chai from 'chai';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as util from 'util';
import * as extrafs from 'fs-extra';

import { doCompendium, askInPrompt } from '../src/clinterpreter';
import {
  Transcript,
  TextInSources,
  Index,
  RichString,
  TextElement,
  TextSegment,
  Paragraph,
  InlineImage,
  RichText,
  Link,
  TableSegment,
  Table,
  TableBody,
  Row,
  Cell,
  List,
  Code,
  IndexSource,
  IndexNode,
  TextOut,
} from '../src/types';
import { ConfigFile } from '../src/config';
import { AsciiDocFileTextIn } from '../src/asciidocInput';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import { HtmlFileTextOut } from '../src/html';
import { PdfFileTextOut } from '../src/pdf';
import { MergerImpl } from '../src/merger';
import { resolve } from 'url';

const expect = chai.expect;
const assert = chai.assert;

//VARIABLES------------------------------------------
let docconfig: ConfigFile;
let index1: Index;
const textinSources: TextInSources = {};
let transcripts: Array<Transcript> = [];
let outputResult: string;
let outputArray: string[];

//paths only test
let testDir1: string = './mocks';
let testDir2: string = './mocks/input-data1';
let testDir3: string = './mocks/input-data2';
let testDir4: string = './mocks/input-data2/images';
let testDir5: string = './mocks/input-data1/images';
let testFile1: string = './mocks/config.json';
let testFile3: string = './mocks/input-data1/manual.adoc';
let testFile2: string = './mocks/input-data2/brownfox2.adoc';
let pathImage: string = './test-data/input/images/fox.png';
const pathImageSunset: string = './test-data/input/images/sunset.jpg';
const pathConfigFile = './test-data/input/config.json';
const pathAdoc1 = './test-data/input/brownfox2.adoc';
const pathAdoc2 = './test-data/input/manual.adoc';
const outputFolder = './test-data/output/';

let testListFiles: string[] = [testFile1, testFile2, testFile3];
let testListDir: string[] = [testDir1, testDir2, testDir3, testDir4, testDir5];

// TEST01
// Should get content from a mock Service
describe('Testing the asciidoc input and the pdf, html, asciidoc Output with good case scenarios', () => {
  before(() => {
    //build the mocks with config file
    try {
      shelljs.mkdir('-p', testListDir);
      shelljs.touch(testListFiles);
      const content1 = fs.readFileSync(pathConfigFile);
      fs.writeFileSync(testFile1, content1);
      const content2 = fs.readFileSync(pathAdoc1);
      fs.writeFileSync(testFile2, content2);
      const content3 = fs.readFileSync(pathAdoc2);
      fs.writeFileSync(testFile3, content3, 'utf8');
      //images
      shelljs.cp(pathImage, './mocks/input-data2/images/fox.png');
      shelljs.cp(pathImageSunset, './mocks/input-data1/images/sunset.jpg');
    } catch (err) {
      throw err;
    }
  });

  describe('Testing Config File function', () => {
    it('Should show', done => {
      docconfig = new ConfigFile(testFile1);
      docconfig
        .getIndex()
        .then(index => {
          index1 = index;
          assert.isArray(index, 'Index must be an array');
          assert.isArray(index[0], 'Souces must be an array');
          assert.isArray(index[1], 'Nodes must be an array');

          expect(index[0]).have.lengthOf(2, 'There are two sources');
          expect(index[1]).have.lengthOf(2, 'There are two nodes');

          expect(index[0][0].key).equals('input-data1');
          expect(index[0][0].kind).equals('asciidoc');
          expect(index[0][0].source).equals('./mocks/input-data1');

          expect(index[0][1].key).equals('input-data2');
          expect(index[0][1].kind).equals('asciidoc');
          expect(index[0][1].source).equals('./mocks/input-data2');

          expect(index[1][0].key).equals('input-data1');
          expect(index[1][0].index).equals('manual.adoc');

          expect(index[1][1].key).equals('input-data2');
          expect(index[1][1].index).equals('brownfox2.adoc');

          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });
  //----------------------------------------------------------------------------------------------------
  describe('AsciidocInput testing the Input with the node brownfox2.adoc', () => {
    it('h2 and h3 with bold and cursive', done => {
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );

      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
          transcripts = [];
          transcripts.push(transcript);
          //test h2
          const h2: TextSegment = transcript.segments[0];
          const h2richString = ((h2 as TextElement).text[0] as RichString).text;
          expect(h2richString).equals('The fox');
          //test h3 with bold and cursive
          const h3: TextSegment = transcript.segments[1];
          const h3richString = ((h3 as TextElement).text[0] as RichString).text;
          expect(h3richString).equals('The ');
          const h3bold = ((h3 as TextElement).text[1] as RichString).text;
          expect(h3bold).equals('real ');
          const h3cursive = ((h3 as TextElement).text[2] as RichString).text;
          expect(h3cursive).equals('fox');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('link and image', done => {
      const transcript = transcripts[0];
      const imageLine = transcript.segments[2];
      const link = (imageLine as Paragraph).text[1];
      expect((link as Link).ref).equals('http://www.google.com');
      const image = (link as Link).text as InlineImage;
      expect(image.img).equals('images/fox.png');
      expect(image.title).equals('Red Fox');
      done();
    });
    it('p, sub and span', done => {
      const transcript = transcripts[0];
      const p: TextSegment = transcript.segments[3];
      const prichString = ((p as TextElement).text[0] as RichString).text;
      expect(prichString).equals('The ');
      const psub = ((p as TextElement).text[1] as RichString).text;
      expect(psub).equals('quick');
      const pspan = ((p as TextElement).text[6] as RichString).text;
      expect(pspan).equals('dog.');
      done();
    });

    it('Table and List', done => {
      const transcript = transcripts[0];
      //test table column width
      const tableObject1: TextSegment = transcript.segments[4];
      const tableObject2 = ((tableObject1 as TableSegment) as Table).content;
      expect(tableObject2.colgroup[0].style).equals('width: 33.3333%;');
      //test table cell paragraph tex
      const tableRow1 = tableObject2.body[5] as Row;
      const cell1 = (tableRow1[0] as Cell).cell[0] as Paragraph;
      const cell1Text = cell1.text[0] as RichString;
      expect(cell1Text.text).equals('footer 1');
      //test table cell list
      const cellList = (tableRow1[2] as Cell).cell[0] as List;
      const cellListNested1 = cellList.elements[2] as List;
      const cellListNested2 = cellListNested1.elements[2] as List;
      const textCellNested2 = (cellListNested2.elements[1] as Paragraph)
        .text[0];
      expect((textCellNested2 as RichString).text).equals('anidadaotravez2');
      done();
    });
  });
  //MANUAL.ADOC---------------------------------------------------------------------------------------
  describe('Asciidoc input with a wider example, manual.adoc', () => {
    it('Code: sample.java', done => {
      textinSources[index1[0][0].key] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][0].key]
        .getTranscript(index1[1][0].index)
        .then(transcript => {
          transcripts = [];
          transcripts.push(transcript);
          const telement1 = (transcript.segments[3] as Paragraph)
            .text[1] as Code;
          if (telement1.language) expect(telement1.language).equals('java');
          expect(telement1.content).includes('Scanner');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Image jpeg', done => {
      const transcript = transcripts[0];
      const image = (transcript.segments[5] as Paragraph)
        .text[1] as InlineImage;
      expect(image.kind).equals('inlineimage');
      expect(image.img).equals('images/sunset.jpg');
      done();
    });
    it('Ordered List 2 levels and Code inside', done => {
      const transcript = transcripts[0];
      const listObject1: TextSegment = transcript.segments[7];
      expect(listObject1.kind).equals('list');
      expect((listObject1 as List).ordered).true;
      const list2Level = (listObject1 as List).elements[1] as List;
      const listItem1 = list2Level.elements[1] as Paragraph;
      const codeItem1 = listItem1.text[1] as Code;
      expect(codeItem1.content).includes('gem');
      done();
    });
  });
  //---------OUTPUT-----------------------------------------------------------------------------------------
  describe('Output to Asciidoc brownfox2', () => {
    it('Testing Generate asciidoc function', done => {
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
          transcripts = [];
          transcripts.push(transcript);
          let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
            outputFolder + 'outBrownfox2',
          );
          out.generate(transcripts).then(() => {
            try {
              //read the output file
              outputResult = fs.readFileSync(
                outputFolder + 'outBrownfox2.adoc',
                'utf8',
              );
              outputArray = [];
              outputArray = outputResult.split('\n');
              expect(outputResult).length.to.not.equal(0);
              done();
            } catch (error) {
              done(error);
            }
          });
        })
        .catch(error => {
          done(error);
        });
    });
    it('Testing Table', done => {
      //table
      expect(outputArray[16]).equals(
        '| 4 | Item 4 | link:http://www.google.es[Google] ',
      );
      done();
    });
    it('Testing list', done => {
      //list
      expect(outputArray[21]).equals('*** anidadaotravez1');
      done();
    });
    it('Testing paragraphs, cursive, bold', done => {
      //paragraph
      expect(outputArray[9]).equals(
        'The ~quick~ *brown fox* *_jumps_* *over* the lazy [.underline]#dog.#',
      );
      done();
    });
  });
  //wider example
  describe('Output to Asciidoc manual.adoc', () => {
    it('Testing generate adoc', done => {
      textinSources[index1[0][0].key] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][0].key]
        .getTranscript(index1[1][0].index)
        .then(transcript => {
          transcripts = [];
          transcripts.push(transcript);
          let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
            outputFolder + 'outManual',
          );
          out.generate(transcripts).then(() => {
            try {
              //read the output file
              outputResult = fs.readFileSync(
                outputFolder + 'outManual.adoc',
                'utf8',
              );
              outputArray = [];
              outputArray = outputResult.split('\n');
              expect(outputResult).length.to.not.equal(0);
              done();
            } catch (error) {
              done(error);
            }
          });
        })
        .catch(error => {
          done(error);
        });
    });
    it('Testing Code', done => {
      //code
      expect(outputArray[9]).equals('```java');
      done();
    });
    it('Testing ol', done => {
      //list
      expect(outputArray[20]).equals(
        '.. Clone the github repository locally `git clone `',
      );
      done();
    });
  });
  //-----------------------------------------------------------------------------------------
  describe('Output to HTML brownfox2', () => {
    it('Testing generate html function', done => {
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
          transcripts = [];
          transcripts.push(transcript);
          let out: HtmlFileTextOut = new HtmlFileTextOut(
            outputFolder + 'outBrownfox2',
          );
          out.generate(transcripts).then(() => {
            try {
              //read the output file
              outputResult = fs.readFileSync(
                outputFolder + 'outBrownfox2.html',
                'utf8',
              );
              outputArray = [];
              outputArray = outputResult.split('\n');
              expect(outputResult).length.to.not.equal(0);
              done();
            } catch (error) {
              done(error);
            }
          });
        })
        .catch(error => {
          done(error);
        });
    });
    it('Testing style and list', done => {
      //compare strings
      expect(outputArray[20].trim()).equals('width:90%;');
      expect(outputArray[108].trim()).equals('<p>anidadaotravez2</p>');
      done();
    });
  });
  //-----------------------------------------------------------------------------------------
  describe('Output to PDF brownfox2', () => {
    it('Testing generate pdf function', done => {
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
          transcripts = [];
          transcripts.push(transcript);
          let out: PdfFileTextOut = new PdfFileTextOut(
            outputFolder + 'outBrownfox2',
          );
          out.generate(transcripts).then(() => {
            //read the output file
            outputResult = fs.readFileSync(
              outputFolder + 'outBrownfox2.html',
              'utf8',
            );
            outputArray = [];
            outputArray = outputResult.split('\n');
            expect(outputResult).length.to.not.equal(0);
            done();
          });
        })
        .catch(error => {
          done(error);
        });
    });
    it('Testing image visualitation', done => {
      done();
    });
  });
  /* //MERGE---------------------------------------------------------
  describe('Testing the merge of two files', () => {
    it('should combine 2 asciidoc in one', done => {
      const sources: IndexSource[] = [
        { key: 'input-data1', kind: 'asciidoc', source: 'mocks/input-data1' },
        { key: 'input-data2', kind: 'asciidoc', source: 'mocks/input-data2' },
      ];

      const nodes: IndexNode[] = [
        { key: 'input-data1', index: 'manual.adoc' },
        { key: 'input-data2', index: 'brownfox2.adoc', sections: [''] },
      ];

      const index: Index = [sources, nodes];

      const textinsources: TextInSources = {};

      textinsources['input-data1'] = new AsciiDocFileTextIn(
        'mocks/input-data1',
      );
      textinsources['input-data2'] = new AsciiDocFileTextIn(
        'mocks/input-data2',
      );

      const merger1 = new MergerImpl();
      const textoutMerger: TextOut = new AsciiDocFileTextOut(
        'mocks/mergerResult',
      );
      merger1
        .merge(textinsources, index, textoutMerger)
        .then(() => {
          if (expect(fs.existsSync('mocks/mergerResult.adoc'))) {
            done();
          } else {
            done(new Error("Files haven't been merged"));
          }
        })
        .catch(error => {
          if (error.include('ENOENT')) {
            done();
          } else done(error);
        });
    });
  }); */

  after(() => {
    try {
      shelljs.rm('-rf', testDir1);
    } catch (error) {
      throw error;
    }
  });
});
