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
  TextInSource,
  Index,
  TextInSources,
  TextElement,
} from '../src/types';
import { InputUrlTextIn } from '../src/inputUrl';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import { ConfigFile } from '../src/config';
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

//url
// 'http://adcenter.capgemini.com/handbook/index.html';

//VARIABLES
let transcripts: Transcript[];
let transcript: Transcript = { segments: [] };
const segments1: Array<TextSegment> = [];
transcript.segments = segments1;
let docconfig: ConfigFile;
let index1: Index;
const textinSources: TextInSources = {};
const outputFolder = 'test-data/output/';
const pathConfigFile = './test-data/confiles/html-url/config.json';
let listFilesOutput: string[] = []; //to erase in after()

xdescribe('Url-html', () => {
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

  describe('Url input', () => {
    it('Testing the input', done => {
      //get the Transcript
      textinSources[index1[0][0].reference] = new InputUrlTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][0].reference]
        .getTranscript(index1[1][0].document)
        .then(transcriptObject => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });
  describe('Url output', () => {
    before(done => {
      //get the Transcript
      textinSources[index1[0][0].reference] = new InputUrlTextIn(
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
    describe('output in asciidoc', () => {
      it('output asciidoc', done => {
        let transcripts: Transcript[] = [];
        transcripts.push(transcript);
        let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
          outputFolder + 'outHandbook',
        );
        out.generate(transcripts).then(() => {
          listFilesOutput.push(outputFolder + 'outHandbook.adoc');
          done();
        });
      });
    });
    xdescribe('output in html', () => {
      it('output html', done => {
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
