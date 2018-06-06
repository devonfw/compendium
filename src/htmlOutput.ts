import {
  TextOut,
  Transcript,
  TextElement,
  Paragraph,
  InlineImage,
  List,
  RichText,
  TableBody,
  RichString,
  Link,
  Code,
  Table,
} from './types';
import { EmitElement } from './emitFunctions';
import * as fs from 'fs';
import * as util from 'util';
import * as extrafs from 'fs-extra';
import * as shelljs from 'shelljs';

export class HtmlFileTextOut implements TextOut {
  public done: boolean = false;
  public asciidoctor = require('asciidoctor.js')();
  private outputFile: string;

  public constructor(file: string) {
    this.outputFile = file;
  }
  /**
   * generate
   * Create the final file parsing the different elements that the input files have
   * @param {Array<Transcript>} data
   * @returns {Promise<void>}
   * @memberof HtmlFileTextOut
   */
  public async generate(data: Array<Transcript>): Promise<void> {
    try {
      await this.moveImages();
    } catch (error) {
      throw error;
    }

    const outputString: Array<any> = [];
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
      const myOutput = this.asciidoctor.convert(outputString.join(''), {
        attributes: { showtitle: true, doctype: 'book' },
      });
      const docWithStyle =
        `<!DOCTYPE html>
            <html>
            <head>
            <style>
            table {
                font-family: arial, sans-serif;
                border-collapse: collapse;
                width: 100%;
            }

            td{
                border: 1px solid #dddddd;
                text-align: left;
            }
            th {
                border: 1px solid #dddddd;
                text-align: left;
                background-color: #dddddd;
            }
            img {
                width:20%;
            }

            </style>
            </head>
            <body>
            ` +
        myOutput +
        `
            </body>
            </html>`;
      try {
        let writePromisify = util.promisify(fs.writeFile);
        await writePromisify(this.outputFile + '.html', docWithStyle, 'utf8');
      } catch (err) {
        throw err;
      }
    }

    this.done = true;
  }
  private async moveImages(): Promise<void> {
    if (await EmitElement.dirExists('imageTemp')) {
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
        await extrafs.copy('./imageTemp', outputDir2);
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
  }
}
