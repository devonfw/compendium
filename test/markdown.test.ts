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
import { MarkdownFileTextOut } from '../src/markdownOutput';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import { MarkdownTextIn } from '../src/markdownInput';
import { HtmlFileTextOut } from '../src/htmlOutput';
import { PdfFileTextOut } from '../src/pdfOutput';
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
const pathConfigFile = './test-data/input/markdown/configLocal.json';
const outputFolder = 'test-data/output/';
let listFilesOutput: string[] = []; //to erase in after()

/**
 * Files .adoc in the config file that contains many generic asciidoc features
 * The folder test-data/input/input-data2 (source 1)
 * Testing Input and Output of the files and the images
 *
 */
describe('Testing the markdown input/output', () => {
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
  //---------------INPUT----------------------------------------------
  describe('Testing input', () => {
    before(done => {
      textinSources[index1[0][0].reference] = new MarkdownTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][0].reference]
        .getTranscript(index1[1][0].document)
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
    it('Input paragraph', done => {
      //test h2
      const elementAux1: Paragraph = transcript.segments[2] as Paragraph;
      const elementAux2 = (elementAux1.text[0] as RichString).text;
      expect(elementAux2).includes('H3');
      done();
    });
    it('Output adoc (to check the correct input transformation', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'document1',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'document1.adoc');
          //read the output file
          outputResult = fs.readFileSync(
            outputFolder + 'document1.adoc',
            'utf8',
          );
          outputArray = [];
          outputArray = outputResult.split('\n');
          //list item
          expect(outputArray[20]).equals('. Another item');
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //------------OUTPUT----------------------------------------
  //each output generation needs its own input
  describe('Testing output', () => {
    before(done => {
      textinSources[index1[0][0].reference] = new MarkdownTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][0].reference]
        .getTranscript(index1[1][0].document)
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
    it('Output markdown', done => {
      let out: MarkdownFileTextOut = new MarkdownFileTextOut(
        outputFolder + 'document2',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'document2.md');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'document2.md', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          //table of contents
          expect(outputArray[25]).equals('Alt-H2');
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
