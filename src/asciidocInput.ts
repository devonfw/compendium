import {
  DocConfig,
  IndexSource,
  Index,
  TextOut,
  TextIn,
  Transcript,
  Paragraph,
  TextSegment,
  TextElement,
  InlineImage,
  TextInSources,
  RichString,
  RichText,
  TextAttributes,
  Table,
  TableBody,
  Col,
  Row,
  Cell,
  Code,
  TableSegment,
  List,
  Link,
} from './types';
import { ParseLocal } from './parseLocal';
import * as fs from 'fs';
import * as util from 'util';
import * as ncp from 'ncp';
import * as shelljs from 'shelljs';

export class AsciiDocFileTextIn implements TextIn {
  public base: string;
  public asciidoctor = require('asciidoctor.js')();
  public htmlparse = require('html-parse');

  public constructor(basepath: string) {
    this.base = basepath;
  }
  /**
   * getTrancript
   * Get the transcript file to write on a single file
   * @param {string} id
   * @param {string[]} [sections]
   * @returns {Promise<Transcript>}
   * @memberof AsciiDocFileTextIn
   */
  public async getTranscript(
    id: string,
    sections?: string[],
  ): Promise<Transcript> {
    const dir = this.base + '/' + id;
    let doc;
    const readFile = util.promisify(fs.readFile);
    try {
      doc = await readFile(dir, 'utf8');
    } catch (err) {
      if (err.code === 'ENOENT') {
        err.message = 'File ' + id + ' in ' + dir + ' not found.';
        throw err;
      } else {
        throw err;
      }
    }
    doc = doc.replace(':toc: macro', '');
    doc = doc.replace('toc::[]', '');
    let dochtml: string = '';
    try {
      dochtml = this.asciidoctor.convert(doc, {
        attributes: { showtitle: true, doctype: 'book' },
      });
    } catch (err) {
      console.log(err.code);
      throw err;
    }
    const tree = this.htmlparse.parse(dochtml);
    const transcript: Transcript = { segments: [] };
    const end: Array<TextSegment> = [];
    ParseLocal.base = this.base;
    for (const branch of tree) {
      const temp = await ParseLocal.recursive(branch, sections);
      for (const final of temp) {
        end.push(final);
      }
    }
    transcript.segments = end;
    return transcript;
  }
}
