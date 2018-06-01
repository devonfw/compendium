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
const outputFolder = 'test-data/output/html/';
const pathConfigFile = './test-data/confiles/html-url/config.json';
let listFilesOutput: string[] = []; //to erase in after()

xdescribe('Url-html Input Output one html page', () => {
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
    it('Testing the input get Transcript', done => {
      //get the Transcript
      textinSources[index1[0][0].reference] = new InputUrlTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][0].reference]
        .getTranscript(index1[1][0].document)
        .then(transcriptObject => {
          let paragraph = transcriptObject.segments[5] as Paragraph;
          let richS = paragraph.text[0] as RichString;
          expect(richS.text).includes('Production Yard');
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
    describe('output in html', () => {
      it('output html', done => {
        let transcripts: Transcript[] = [];
        transcripts.push(transcript);
        let out: HtmlFileTextOut = new HtmlFileTextOut(
          outputFolder + 'outHandbook',
        );
        out
          .generate(transcripts)
          .then(() => {
            listFilesOutput.push(outputFolder + 'outHandbook.html');
            //read the output file
            let outputResult = fs.readFileSync(
              outputFolder + 'outHandbook.html',
              'utf8',
            );
            let outputArray = outputResult.split('\n');
            expect(outputArray[90]).includes('Production Yard');
            done();
          })
          .catch(error => {
            done(error);
          });
      });
    });
  });

  after(() => {
    try {
      // clean fixture
      //shelljs.rm('-rf', outputFolder);
    } catch (error) {
      throw error;
    }
  });
});
//___________________________All links from Index_____________________________________________
xdescribe('Url-html all Index Handbook Input', () => {
  before(done => {
    //get the index ready
    let configFilePath = './test-data/confiles/html-url/configAllIndex.json';
    docconfig = new ConfigFile(configFilePath);
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
  describe('Get titles list from an index', () => {
    it('index handbook page', done => {
      //constructor
      textinSources[index1[0][0].reference] = new InputUrlTextIn(
        index1[0][0].source,
      );
      //get index list
      textinSources[index1[1][0].reference]
        .getIndexList(index1[1][0].document)
        .then(documentsList => {
          if (documentsList.length > 0) {
            //save the list inside the index
            documentsList.forEach(title => {
              index1[1].push({
                reference: index1[0][0].reference,
                document: title,
              });
            });

            textinSources[index1[1][15].reference]
              .getTranscript(index1[1][15].document)
              .then(transcript => {
                let paragraph = transcript.segments[3] as Paragraph;
                let link1 = paragraph.text[0] as Link;
                let link2 = link1.text as Paragraph;
                let link3 = link2.text[0] as RichString;
                expect(link3.text).includes('Accelerated Solution Design');

                done();
              })
              .catch(error => {
                done(error);
              });
          }
        })
        .catch(error => {
          done(error);
        });
    });
  });
  after(() => {});
});
