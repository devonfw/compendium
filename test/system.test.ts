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
const pathConfigFile = './test-data/input/config.json';

let outputFile: string;
let configFilePath: string;
let outputFormat: string;
let inputFormat: string;

//SYSTEM DO COMPENDIUM TEST
describe('System01 test doCompendium from confluence/asciidoc to asciidoc', () => {
  before(done => {
    //variables
    configFilePath = './test-data/input/config.json';
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
  xdescribe('System test', () => {
    it('To asciidoc', done => {
      doCompendium(configFilePath, 'asciidoc', outputFile)
        .then(() => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });
  describe('System test', () => {
    it('To html', done => {
      doCompendium(configFilePath, 'html', outputFile)
        .then(() => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });
  xdescribe('System test', () => {
    it('To pdf', done => {
      doCompendium(configFilePath, 'pdf', './test-data/output/systemOut')
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
