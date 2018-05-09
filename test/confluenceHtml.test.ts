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
import { ParseLocal } from '../src/parseLocal';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import { ParseConfluence } from '../src/parseConfluence';
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

describe('Confluence01 from html to Transcript', () => {
  before(() => {
    //setup fixture
  });

  describe('html text in', () => {
    it('Obtaining the Transcript object from html', done => {
      const end: Array<TextSegment> = [];
      try {
        const htmlView = fs.readFileSync(htmlFile1);
        const tree = htmlparse.parse(htmlView);
        ParseConfluence.base = 'test-data/confluence-html';
        for (const branch of tree) {
          const temp = ParseConfluence.recursive(branch);
          for (const final of temp) {
            end.push(final);
          }
        }
        transcript.segments = end;
        expect(transcript.segments[0].kind).equals('list');
        let listObject1 = transcript.segments[0] as List;
        expect(listObject1.ordered).true;

        done();
      } catch (error) {
        done(error);
      }
    });
  });

  after(() => {
    // clean fixture
  });
});

describe('Confluence02 from Transcript to asciidoc', () => {
  before(() => {
    //setup fixture
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

  after(() => {
    // clean fixture
  });
});
//errors in asciidoctor from ascii to html
xdescribe('Confluence03 from Transcript to html', () => {
  before(() => {
    //setup fixture
  });

  describe('From transcript to html', () => {
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
      shelljs.rm(listFilesOutput);
    } catch (error) {
      throw error;
    }
  });
});
