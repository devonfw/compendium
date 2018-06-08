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
import * as shelljs from 'shelljs';
import * as showdown from 'showdown';

export class MarkdownTextIn implements TextIn {
  public base: string;
  public htmlparse = require('html-parse');

  public constructor(basepath: string) {
    this.base = basepath;
  }
  /**
   * getTrancript
   * Get the transcript file to write on a single file
   * source type markdown read from local md files
   * must be extension .md (for now)
   * @param {string} id
   * @param {string[]} [sections]
   * @returns {Promise<Transcript>}
   * @memberof MarkdownTextIn
   */
  public async getTranscript(
    id: string,
    sections?: string[],
  ): Promise<Transcript> {
    const dir = this.base + '/' + id + '.md';
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
    //from markdown to html
    doc = doc.replace(':toc: macro', '');
    doc = doc.replace('toc::[]', '');
    let converter = new showdown.Converter();
    let dochtml: string = '';
    try {
      dochtml = converter.makeHtml(doc);
    } catch (err) {
      console.log(err.code);
      throw err;
    }
    const tree = this.htmlparse.parse(dochtml);
    const transcript: Transcript = { segments: [] };
    const end: Array<TextSegment> = [];
    //new instance static variables
    ParseLocal.base = this.base;
    ParseLocal.arrayImagesSrc = [];
    for (const branch of tree) {
      const temp = await ParseLocal.recursive(branch, sections);
      for (const final of temp) {
        end.push(final);
      }
    }
    transcript.segments = end;
    //validate images before copying
    ParseLocal.checkImagesList();
    //copy images
    if (ParseLocal.arrayImagesSrc.length > 0) {
      for (const src of ParseLocal.arrayImagesSrc) {
        await ParseLocal.copyImage(src);
      }
    }
    return transcript;
  }
  //in case get all from an index is implemented
  public supportsExport(): boolean {
    return false;
  }
  //not implemented yet
  public async getIndexList(title: string): Promise<string[]> {
    let arrayResult: string[] = [];
    return arrayResult;
  }
}
