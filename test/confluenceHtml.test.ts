import {
  TextIn,
  Credentials,
  TextOut,
  RichText,
  RichString,
  Cookies,
  Transcript,
  TextSegment,
  Link,
  Paragraph,
  InlineImage,
  List,
} from '../src/types';
import { ConfluenceTextIn } from '../src/confluence';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import { ParseLocal } from '../src/parseLocal';
import { HtmlFileTextOut } from '../src/html';

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();

// Output -> To see transcript in a file (Optional)
const outputPath01 = 'test-data/output/confluence/output1.json';
const outputFolder = './test-data/output/';
//html from confluence
let htmlFile1: string =
  'test-data/confluence-html/Jump-the-queue-Home_2163154.html';
let htmlparse = require('html-parse');
const transcript: Transcript = { segments: [] };
let listFilesOutput: string[] = []; //to erase in after()

xdescribe('Confluence01 from html to Transcript', () => {
  before(done => {
    //get the Transcript ready for the tests
    const end: Array<TextSegment> = [];
    try {
      const htmlView = fs.readFileSync(htmlFile1);
      const tree = htmlparse.parse(htmlView);
      ParseLocal.base = 'test-data/confluence-html';
      for (const branch of tree) {
        const temp = ParseLocal.recursive(branch);
        for (const final of temp) {
          end.push(final);
        }
      }
      transcript.segments = end;
      done();
    } catch (error) {
      done(error);
    }
  });

  describe('html text in', () => {
    it('Obtaining the Transcript object from html', done => {
      expect(transcript.segments[0].kind).equals('list');
      let listObject1 = transcript.segments[0] as List;
      expect(listObject1.ordered).true;

      done();
    });
  });
  describe('From transcript to asciidoc', () => {
    it('Obtaining the asciidoc', done => {
      let transcripts: Transcript[] = [];
      transcripts.push(transcript);
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'outJumpTheQueue',
      );
      out.generate(transcripts).then(() => {
        listFilesOutput.push(outputFolder + 'outJumpTheQueue.adoc');
        done();
      });
    });
  });
  xdescribe('From transcript to html', () => {
    it('Obtaining the html', done => {
      let transcripts: Transcript[] = [];
      transcripts.push(transcript);
      let out: HtmlFileTextOut = new HtmlFileTextOut(
        outputFolder + 'outJumpTheQueue',
      );
      out.generate(transcripts).then(() => {
        listFilesOutput.push(outputFolder + 'outJumpTheQueue.html');
        done();
      });
    });
  });

  after(() => {
    try {
      //delete all output files
      //shelljs.rm(listFilesOutput);
    } catch (error) {
      throw error;
    }
  });
});
