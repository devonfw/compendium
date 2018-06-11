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
  Cookie,
  List,
  TextElement,
  Table,
} from '../src/types';
import {
  doCompendium,
  askInPrompt,
  getSessionCookieByConnectorApi,
} from '../src/clinterpreter';
import { ConnectorApi } from '../src/connectorApi';
import { Utilities } from '../src/utils';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as extrafs from 'fs-extra';
import chalk from 'chalk';
import { ConfigFile } from '../src/config';
import { ConfluenceTextIn } from '../src/confluenceInput';

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();

let credentials: Credentials;

const outputFolder = 'test-data/output/confluenceInternal/';
const configFilePathCapgemini =
  './test-data/input/confluence/configCapgemini.json';

let outputFile: string;
let outputFormat: string;
let inputFormat: string;
let docconfig: ConfigFile;
let index1: Index;
let textinConfluence01: TextInSources = {};
let transcripts: Transcript[] = [];
let transcript: Transcript = { segments: [] };
const segments1: Array<TextSegment> = [];
transcript.segments = segments1;
let brandNewDayProd: Cookie;
let cookieArray: Cookies = [];
let credentialsI: Credentials = { username: '', password: '' };

//CONFLUENCE INTERNAL
describe('ConfluenceInternal01 Internal Capgemini account', () => {
  before(done => {
    //get the index ready
    docconfig = new ConfigFile(configFilePathCapgemini);
    docconfig
      .getIndex()
      .then(index => {
        index1 = index;
        //ask the credentials
        console.log(
          chalk.bold(
            `Please enter credentials for source with key '${chalk.green.italic(
              index1[0][1].reference,
            )}' (${chalk.blue(index1[0][1].source)})\n`,
          ),
        );
        Utilities.askInPrompt()
          .then(credentials => {
            credentialsI = credentials;
            done();
          })
          .catch(error => {
            done(error);
          });
      })
      .catch(error => {
        done(error);
      });
  });
  describe('Testing connectorApi connect()', () => {
    it('Get the BrandNewDayProd cookie', done => {
      let connectorApi: ConnectorApi = new ConnectorApi(
        credentialsI.username,
        credentialsI.password,
        '',
      );
      connectorApi.connect().then(response => {
        expect(response[0]).includes('brandNewDayProd');
        done();
      });
    });
  });
  describe('Testing textInConfluence with cookies', () => {
    before(done => {
      //get the cookie
      let connectorApi: ConnectorApi = new ConnectorApi(
        credentialsI.username,
        credentialsI.password,
        '',
      );
      connectorApi.connect().then(response => {
        //format the cookie into our interface Cookie
        let brandCookieValue: string;
        let cookieBrand = response[0].toString();
        let aux1 = cookieBrand.split(';');
        let aux2 = aux1[0].split('=');
        brandCookieValue = aux2[1];
        brandNewDayProd = {
          name: 'brandNewDayProd',
          value: brandCookieValue,
        };
        cookieArray.push(brandNewDayProd);
        done();
      });
    });
    describe('TextIn with cookies', () => {
      it('Text in paragraph', done => {
        textinConfluence01[index1[0][1].reference] = new ConfluenceTextIn(
          index1[0][1].source,
          index1[0][1].space,
          cookieArray,
        );
        textinConfluence01[index1[1][2].reference]
          .getTranscript(index1[1][2].document)
          .then(transcriptObject => {
            //testing de IR
            let paragraph1 = (transcriptObject.segments[0] as Paragraph)
              .text[0] as RichString;
            expect(paragraph1.text).to.include(
              'The objectives of the project are:',
            );
            done();
          })
          .catch(error => {
            done(error);
          });
      });
    });
    describe('TextIn with sections', () => {
      it('sections', done => {
        textinConfluence01[index1[0][0].reference] = new ConfluenceTextIn(
          index1[0][0].source,
          index1[0][0].space,
          cookieArray,
        );
        textinConfluence01[index1[1][0].reference]
          .getTranscript(index1[1][0].document, index1[1][0].sections)
          .then(transcriptObject => {
            let paragraph1 = (transcriptObject.segments[0] as TextElement)
              .text[0] as RichString;
            expect(paragraph1.text).to.include('Epic 2. Consult the queue');
            expect((transcriptObject.segments[7] as Table).kind).equals(
              'table',
            );
            done();
          })
          .catch(error => {
            done(error);
          });
      });
    });
  });
});
