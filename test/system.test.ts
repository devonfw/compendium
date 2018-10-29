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
import { doCompendium, askInPrompt } from '../src/clinterpreter';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as extrafs from 'fs-extra';

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();

let credentials: Credentials;

const outputFolder = 'test-data/output/system/';
const configFilePath = './test-data/input/configLocal.json';
const configFilePathCapgemini =
  './test-data/input/confluence/configCapgemini.json';

let outputFile: string;
let outputFormat: string;
let inputFormat: string;

//SYSTEM DO COMPENDIUM TEST
//LOCAL FILES
describe('System01 test doCompendium from asciidoc in local to asciidoc', () => {
  before(done => {
    //variables
    outputFile = './test-data/output/system/systemOut';
    outputFormat = 'asciidoc';
    extrafs
      .ensureDir(outputFolder)
      .then(() => {
        done();
      })
      .catch(error => {
        done(error);
      });
  });
  describe('System test', () => {
    it('To asciidoc', done => {
      doCompendium(configFilePath, outputFormat, outputFile)
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
    //shelljs.rm('-rf', outputFolder);
  });
});
//CONFLUENCE INTERNAL
describe('System02 test doCompendium from confluence capgemini to html', () => {
  before(done => {
    //variables
    outputFile = './test-data/output/system/systemOutInternal';
    outputFormat = 'html';
    extrafs
      .ensureDir(outputFolder)
      .then(() => {
        done();
      })
      .catch(error => {
        done(error);
      });
  });
  describe('System test', () => {
    it('To asciidoc', done => {
      doCompendium(configFilePathCapgemini, outputFormat, outputFile)
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
    //shelljs.rm('-rf', outputFolder);
  });
});
