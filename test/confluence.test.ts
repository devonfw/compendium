import {
  TextIn,
  Credentials,
  TextOut,
  RichText,
  RichString,
  Cookies,
  Transcript,
  TextSegment,
} from '../src/types';
import { ConfluenceTextIn } from '../src/confluence';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import { HtmlFileTextOut } from '../src/html';
import { PdfFileTextOut } from '../src/pdf';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();

let basepath: string;
let space: string;
let credentials: Credentials;
let cookies: Cookies;
let id: string;
let id_badFormat: string;
let id_multiplePages: string;

// Default values for ConfluenceTextIn constructor
basepath = 'https://murtasanjuanases.atlassian.net/wiki/';
space = 'PD';
credentials = {
  username: 'murta.sanjuan-ases-external@capgemini.com',
  password: 'Admin1234',
};
cookies = [
  {
    name: 'brandNewDayProd',
    value: 'abcd',
  },
];
let transcripts: Transcript[] = [];
let transcript: Transcript = { segments: [] };
const segments1: Array<TextSegment> = [];
transcript.segments = segments1;
const outputFolder = 'test-data/output/confluence/';

// Default id values
id = 'Operating+Mode';
id_badFormat = 'bad+format';
id_multiplePages = 'multiple+pages';

// Output -> To see transcript in a file (Optional)
const outputPath01 = 'test-data/output/confluence/output1.json';

// TEST01
// Should get content from Murta's space

describe('Confluence01 Testing the Output and Input of Text and doc generation', () => {
  before(done => {
    if (fs.existsSync(outputPath01)) {
      fs.unlinkSync(outputPath01);
    }
    //setup fixture
    const textinConfluence01 = new ConfluenceTextIn(
      basepath,
      space,
      credentials,
    );
    textinConfluence01
      .getTranscript(id)
      .then(transcriptObject => {
        //save the transcript for other test
        transcripts = [];
        transcripts.push(transcriptObject);
        transcript = transcripts[0];

        // Compare transcript
        done();
      })
      .catch(error => {
        done(error);
      });
  });
  describe('Input', () => {
    it('input', done => {
      // To see transcript in a file (Optional). Existing path is required.
      fs.writeFileSync(
        outputPath01,
        JSON.stringify(transcript, null, 2),
        'utf8',
      );

      done();
    });
  });
  describe('Output', () => {
    it('To asciidoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'confluence01',
      );

      out
        .generate(transcripts)
        .then(() => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });
  describe('Output', () => {
    it('To html', done => {
      let out: HtmlFileTextOut = new HtmlFileTextOut(
        outputFolder + 'confluence01',
      );

      out
        .generate(transcripts)
        .then(() => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });
  describe('Output', () => {
    it('To pdf', done => {
      let out: PdfFileTextOut = new PdfFileTextOut(
        outputFolder + 'confluence01',
      );

      out
        .generate(transcripts)
        .then(() => {
          done();
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
