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
import { EmitElement } from '../src/emitFunctions';
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
let transcript: Transcript = { segments: [] };
const segments1: Array<TextSegment> = [];
transcript.segments = segments1;

//paths only test
let pathImage: string = './test-data/input/images/fox.png';
const pathImageSunset: string = './test-data/input/images/sunset.jpg';
const pathConfigFile = './test-data/input/config.json';
const pathAdoc1 = './test-data/input/brownfox2.adoc';
const pathAdoc2 = './test-data/input/manual.adoc';
const outputFolder = 'test-data/output/';
let listFilesOutput: string[] = []; //to erase in after()

/**
 * Files .adoc in the config file that contains many generic asciidoc features
 * The folder test-data/input/input-data2 (source 1)
 * Testing Input and Output of the files and the images
 *
 */
describe('Testing the asciidoc input and the pdf, html, asciidoc Output with good case scenarios', () => {
  before(done => {
    //get the index ready
    docconfig = new ConfigFile(pathConfigFile);
    docconfig
      .getIndex()
      .then(index => {
        index1 = index;
        done();
      })
      .catch(error => {
        done(error);
      });
  });
  //-------------------------CONFIG FILE----------------------------------------------------------------------------------
  describe('Testing Config File function', () => {
    it('Should show', done => {
      assert.isArray(index1, 'Index must be an array');
      assert.isArray(index1[0], 'Souces must be an array');
      assert.isArray(index1[1], 'Documents must be an array');

      expect(index1[0]).have.lengthOf(3, 'There are two sources');
      expect(index1[1]).have.lengthOf(15, 'There are 12 documents');

      expect(index1[0][0].reference).equals('project1');
      expect(index1[0][0].source_type).equals('asciidoc');
      expect(index1[0][0].source).equals('./test-data/input/input-data1');

      expect(index1[0][1].reference).equals('project2');
      expect(index1[0][1].source_type).equals('asciidoc');
      expect(index1[0][1].source).equals('./test-data/input/input-data2');

      expect(index1[1][0].reference).equals('project1');
      expect(index1[1][0].document).equals('manual');

      expect(index1[1][1].reference).equals('project2');
      expect(index1[1][1].document).equals('brownfox2');

      done();
    });
  });
  //-------PARAGRAPH 1---------------------------------------------------------------------------------------------
  describe('Testing h2 and h3 with bold and cursive, paragraph1.adoc in input-data2', () => {
    before(done => {
      textinSources[index1[0][1].reference] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][2].reference]
        .getTranscript(index1[1][2].document)
        .then(transcriptObject => {
          transcripts = [];
          transcripts.push(transcriptObject);
          transcript = transcripts[0];
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Input', done => {
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
    });
    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'paragraph1',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'paragraph1.adoc');
          //read the output file
          outputResult = fs.readFileSync(
            outputFolder + 'paragraph1.adoc',
            'utf8',
          );
          outputArray = [];
          outputArray = outputResult.split('\n');
          expect(outputArray[3]).equals('== The fox');
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //-------------IMAGE WITH LINK------------------------------------------------
  describe('Testing link and image, image.adoc in input-data2', () => {
    before(done => {
      //get the Transcript IO ready
      transcripts = [];
      textinSources[index1[0][1].reference] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][4].reference]
        .getTranscript(index1[1][4].document)
        .then(transcriptObject => {
          transcripts.push(transcriptObject);
          transcript = transcripts[0];
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Input', done => {
      const imageLine = transcript.segments[0];
      const link = (imageLine as Paragraph).text[1];
      expect((link as Link).ref).equals('http://www.google.com');
      const image = (link as Link).text as InlineImage;
      expect(image.img).equals('images/fox.png');
      expect(image.title).equals('Red Fox');
      done();
    });

    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'image',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'image.adoc');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'image.adoc', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          //the image output
          expect(outputArray[3].trim()).equals(
            'image:images/fox.png[Red Fox, link="http://www.google.com"]',
          );
          //image file inside the right folder
          /* EmitElement.dirExists(outputFolder + '/images/fox.png').then(
            isFile => {
              expect(isFile).to.be.true;
              done();
            },
          ); */
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('Output html', done => {
      let out: HtmlFileTextOut = new HtmlFileTextOut(outputFolder + 'image');
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'image.html');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'image.html', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          //image
          expect(outputArray[30]).equals(
            '<p><span class="image"><a class="image" href="http://www.google.com"><img src="images/fox.png" alt="Red Fox"></a></span></p>',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //-------------------PARAGRAPH2------------------------------------------------
  describe('Testing p, sub and span, paragraph2.adoc in input-data2', () => {
    before(done => {
      //get the Transcript IO ready
      transcripts = [];
      textinSources[index1[0][1].reference] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][3].reference]
        .getTranscript(index1[1][3].document)
        .then(transcriptObject => {
          transcripts.push(transcriptObject);
          transcript = transcripts[0];
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Input', done => {
      const p: TextSegment = transcript.segments[0];
      const prichString = ((p as TextElement).text[0] as RichString).text;
      expect(prichString).equals('The ');
      const psub = ((p as TextElement).text[1] as RichString).text;
      expect(psub).equals('quick');
      const pspan = ((p as TextElement).text[6] as RichString).text;
      expect(pspan).equals('dog.');
      done();
    });
    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'paragraph2',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'paragraph2.adoc');
          //read the output file
          outputResult = fs.readFileSync(
            outputFolder + 'paragraph2.adoc',
            'utf8',
          );
          outputArray = [];
          outputArray = outputResult.split('\n');
          expect(outputArray[3]).equals(
            'The ~quick~ *brown fox* *_jumps_* *over* the lazy [.underline]#dog.#',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
    it('Output html', done => {
      let out: HtmlFileTextOut = new HtmlFileTextOut(
        outputFolder + 'paragraph2',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'paragraph2.html');
          //read the output file
          outputResult = fs.readFileSync(
            outputFolder + 'paragraph2.html',
            'utf8',
          );
          outputArray = [];
          outputArray = outputResult.split('\n');
          expect(outputArray[30]).equals(
            '<p>The <sub>quick</sub> <strong>brown fox</strong> <strong><em>jumps</em></strong> <strong>over</strong> the lazy <span class="underline">dog.</span></p>',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //---------------TABLE WITH LIST AND CODE-----------------------------------------------
  describe('Testing Table and List inside, tableList.adoc in input-data2', () => {
    before(done => {
      //get the Transcript IO ready
      transcripts = [];
      textinSources[index1[0][1].reference] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][5].reference]
        .getTranscript(index1[1][5].document)
        .then(transcriptObject => {
          transcripts.push(transcriptObject);
          transcript = transcripts[0];
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Input', done => {
      //test table column width
      const tableObject1: TextSegment = transcript.segments[0];
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
    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'table',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'table.adoc');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'table.adoc', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          //table
          expect(outputArray[8]).equals(
            '| 4 | Item 4 | link:http://www.google.es[Google] ',
          );
          //list inside table
          expect(outputArray[13]).equals('*** anidadaotravez1');
          done();
        } catch (error) {
          done(error);
        }
      });
    });
    it('Output html', done => {
      let out: HtmlFileTextOut = new HtmlFileTextOut(outputFolder + 'table');
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'table.html');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'table.html', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          //style
          expect(outputArray[20].trim()).equals('width:20%;');
          //list
          expect(outputArray[84].trim()).equals('<p>anidadaotravez2</p>');
          //table
          expect(outputArray[57]).equals(
            '<td class="tableblock halign-left valign-top"><p class="tableblock">4</p></td>',
          );
          //link inside a table cell
          expect(outputArray[59]).equals(
            '<td class="tableblock halign-left valign-top"><p class="tableblock"><a href="http://www.google.es">Google</a></p></td>',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  after(() => {
    try {
      //delete all output files
      shelljs.rm(listFilesOutput);
      shelljs.rm('-rf', outputFolder.concat('images'));
    } catch (error) {
      throw error;
    }
  });
});
