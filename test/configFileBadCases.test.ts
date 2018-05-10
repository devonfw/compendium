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
import { AsciiDocFileTextIn } from '../src/asciidocInput';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import { HtmlFileTextOut } from '../src/html';
import { PdfFileTextOut } from '../src/pdf';
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

//paths only test
const badConfigFolder = './test-data/confiles/bad/';

/**
 * Bad Case Scnarios for Config File
 *
 * Mocks are located in the @param {string} outputFolder
 */
describe('Testing the asciidoc input and the pdf, html, asciidoc Output with BAD case scenarios', () => {
  before(() => {});
  describe('Bad Config Files testing docconfig.getIndex method', () => {
    it('Bad properties', done => {
      const errorMessageResult = 'JSON: Some sources have the wrong property';
      docconfig = new ConfigFile(badConfigFolder + 'badProperties.json');
      docconfig
        .getIndex()
        .then(index => {
          done('Test fail to throw the error ');
        })
        .catch(error => {
          expect(error.message).includes(errorMessageResult);
          done();
        });
    });
    it('Duplicate Source', done => {
      const errorMessageResult =
        'JSON: Data inconsistency, some sources have the same reference.';
      docconfig = new ConfigFile(badConfigFolder + 'duplicateSources.json');
      docconfig
        .getIndex()
        .then(index => {
          done('Test fail to throw the error ');
        })
        .catch(error => {
          expect(error.message).includes(errorMessageResult);
          done();
        });
    });
    it('Orphan nodes', done => {
      const errorMessageResult =
        'JSON: Data inconsistency, some documents references are not matching with the sources.';
      docconfig = new ConfigFile(badConfigFolder + 'orphanNodes.json');
      docconfig
        .getIndex()
        .then(index => {
          done('Test fail to throw the error ');
        })
        .catch(error => {
          expect(error.message).includes(errorMessageResult);
          done();
        });
    });
  });

  after(() => {});
});
