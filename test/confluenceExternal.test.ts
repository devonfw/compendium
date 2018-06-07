import {
  TextIn,
  Credentials,
  TextOut,
  RichText,
  RichString,
  Cookies,
  Transcript,
  TextSegment,
  Index,
  TextInSources,
  Paragraph,
} from '../src/types';
import { ConfluenceTextIn } from '../src/confluenceInput';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import { HtmlFileTextOut } from '../src/htmlOutput';
import { PdfFileTextOut } from '../src/pdfOutput';
import { ConfigFile } from '../src/config';
import { ConnectorApi } from '../src/connectorApi';
import { Utilities } from '../src/utils';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as extrafs from 'fs-extra';
import chalk from 'chalk';

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
//credentials external account
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

let docconfig: ConfigFile;
let index1: Index;
let transcripts: Transcript[] = [];
let transcript: Transcript = { segments: [] };
const segments1: Array<TextSegment> = [];
transcript.segments = segments1;
let textinConfluence01: TextInSources = {};
const outputFolder = 'test-data/output/confluence/';
const pathConfigFile = './test-data/input/config.json';

// Output -> To see transcript in a file (Optional)
const outputPath01 = 'test-data/output/confluence/output1.json';

// TEST01
// Should get content from external Murta's confluence account
//the account has been removed (free trial)
//to do the test please open an account in confluence an change the credentials
xdescribe('Confluence Test', () => {
  before(done => {
    extrafs
      .ensureDir(outputFolder)
      .then(() => {
        done();
      })
      .catch(error => {
        done(error);
      });
  });
  describe('Confluence01 Testing the Output and Input of one document', () => {
    before(done => {
      //json file to see transcript geting ready
      if (fs.existsSync(outputPath01)) {
        fs.unlinkSync(outputPath01);
      }
      //get the index ready
      docconfig = new ConfigFile(pathConfigFile);
      docconfig
        .getIndex()
        .then(index => {
          index1 = index;
          textinConfluence01[index1[0][2].reference] = new ConfluenceTextIn(
            index[0][2].source,
            index[0][2].space,
            credentials,
          );
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    describe('Input document [12] with jpeg image', () => {
      it('input', done => {
        textinConfluence01[index1[1][12].reference]
          .getTranscript(index1[1][12].document)
          .then(transcriptObject => {
            //save the transcript for other test
            transcripts = [];
            transcripts.push(transcriptObject);
            transcript = transcripts[0];

            // To see transcript in a file (Optional). Existing path is required.
            fs.writeFileSync(
              outputPath01,
              JSON.stringify(transcript, null, 2),
              'utf8',
            );
            //testing de IR
            expect(
              ((transcript.segments[0] as Paragraph).text[0] as RichString)
                .text,
            ).to.include('Asciidoctor is a');
            done();
          })
          .catch(error => {
            done(error);
          });
      });
    });
    describe('Output document [12]', () => {
      it('To pdf', done => {
        //output folder changed as htmltopdf library doesn´t support await
        let out: PdfFileTextOut = new PdfFileTextOut(
          'test-data/output/' + 'confluence01',
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
  describe('Confluence02 Testing the Input and Output of document [13] with png image', () => {
    before(done => {
      //get the index ready
      docconfig = new ConfigFile(pathConfigFile);
      docconfig
        .getIndex()
        .then(index => {
          index1 = index;
          //get the transcript from config file
          textinConfluence01[index1[0][2].reference] = new ConfluenceTextIn(
            index[0][2].source,
            index[0][2].space,
            credentials,
          );
          textinConfluence01[index1[1][13].reference]
            .getTranscript(index1[1][13].document)
            .then(transcriptObject => {
              //save the transcript for other test
              transcripts = [];
              transcripts.push(transcriptObject);
              transcript = transcripts[0];

              done();
            });
        })
        .catch(error => {
          done(error);
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
            //testing the right content of output file
            //read the output file
            let outputResult = fs.readFileSync(
              outputFolder + 'confluence01.adoc',
              'utf8',
            );
            let outputArray = [];
            outputArray = outputResult.split('\n');
            expect(outputArray[3]).to.include('image:images/PD/688139.jpg[]');
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
            //testing the right content of output file
            //read the output file
            let outputResult = fs.readFileSync(
              outputFolder + 'confluence01.html',
              'utf8',
            );
            let outputArray = [];
            outputArray = outputResult.split('\n');
            expect(outputArray[47]).to.include(
              '<h2 id="_operating_mode">Operating Mode</h2>',
            );
            done();
          })
          .catch(error => {
            done(error);
          });
      });
    });

    after(() => {});
  });

  after(() => {
    // clean fixture
    shelljs.rm('-rf', outputFolder);
  });
});
