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
import { EmitElement } from './emitFunctions';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as util from 'util';
import * as extrafs from 'fs-extra';

export class AsciiDocFileTextOut implements TextOut {
  public done: boolean = false;
  private outputFile: string;

  public constructor(file: string) {
    this.outputFile = file;
  }
  /**
   * generate
   * Create the final file parsing the different elements that the input files have
   * @param {Array<Transcript>} data
   * @returns {Promise<void>}
   * @memberof AsciiDocFileTextOut
   */
  public async generate(data: Array<Transcript>): Promise<void> {
    if (EmitElement.dirExists('./imageTemp/')) {
      const arrayDir = this.outputFile.split('/');
      const outputDir: Array<string> = [];
      outputDir.push('./');
      let outputDir2 = '';
      if (arrayDir.length > 1) {
        arrayDir.splice(-1, 1);
        for (const piece of arrayDir) {
          outputDir.push(piece);
        }
        outputDir2 = outputDir.join('/');
      }

      try {
        let copyPromisify = util.promisify(extrafs.copy);
        await copyPromisify('./imageTemp', outputDir2);
        shelljs.rm('-rf', 'imageTemp');
      } catch (err) {
        if (
          err.code !== 'ENOENT' &&
          err.code !== 'ENOTEMPTY' &&
          err.code !== 'EBUSY'
        )
          console.log(err.message);
      }
    }
    const outputString: Array<string> = [];
    outputString.push(':toc: macro\ntoc::[]\n\n');
    if (data.length < 1) {
      throw new Error('No Text instances passed');
    } else {
      for (const node of data) {
        for (const segment of node.segments) {
          if (segment.kind === 'textelement') {
            outputString.push(EmitElement.emitTextElement(segment));
            outputString.push('\n\n');
          } else if (segment.kind === 'paragraph') {
            outputString.push(EmitElement.emitParagraph(segment));
            outputString.push('\n\n');
          } else if (segment.kind === 'inlineimage') {
            outputString.push(EmitElement.emitImage(segment));
            outputString.push('\n\n');
          } else if (segment.kind === 'table') {
            outputString.push(EmitElement.emitTable(segment.content));
            outputString.push('\n\n');
          } else if (segment.kind === 'list') {
            outputString.push(EmitElement.emitList(segment));
            outputString.push('\n\n');
          } else if (segment.kind === 'link') {
            outputString.push(EmitElement.emitLink(segment));
            outputString.push('\n\n');
          } else if (segment.kind === 'code') {
            outputString.push(EmitElement.emitCode(segment));
            outputString.push('\n\n');
          }
        }
        outputString.push('\n\n');
      }

      try {
        let writePromisify = util.promisify(fs.writeFile);
        await writePromisify(this.outputFile + '.adoc', outputString.join(''));
      } catch (err) {
        throw err;
      }
    }
    this.done = true;
  }
}
