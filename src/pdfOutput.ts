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
import { Utilities } from './utils';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as util from 'util';
import * as extrafs from 'fs-extra';

export class PdfFileTextOut implements TextOut {
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
   * @memberof PdfFileTextOut
   */
  public async generate(data: Array<Transcript>): Promise<void> {
    try {
      await this.moveTheImages();
    } catch (err) {
      throw err;
    }

    let outputString: Array<string> = [];
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
        outputString.push('\n\n<<<<\n\n');
      }
      const dochtml = this.asciidoctor.convert(outputString.join(''), {
        attributes: { showtitle: true, doctype: 'book' },
      });
      //add css style
      let docWithStyle = this.addStyle(dochtml);

      //pdf only works in the project folder
      const fileName = this.getNameOfFileOnly();
      try {
        await extrafs.writeFile(fileName + '.html', docWithStyle, 'utf8');
      } catch (err) {
        throw err;
      }
      //pdf module
      //NOTE: there is a problem with the utf8, the module html-to-pdf works fine but not with big pdfs
      //this is pending issue
      var htmlTo = require('htmlto');

      var options = {
        pathTohtml: fileName + '.html',
        pathTopdf: this.outputFile + '.pdf',
        paperSize: {
          format: 'A4',
          orientation: 'portrait',
          margin: '1.5cm',
        },
      };

      htmlTo.pdf(options, async (error: any, success: any) => {
        if (error) {
          console.log(error);
        }
        if (success) {
          //we move the path to the user output path
          try {
            extrafs.unlink(fileName + '.html');
          } catch (error) {
            console.log(error);
          }
        }
      });
    }
    this.done = true;
  }
  /**
   * moveTheImages
   * Move the images and remove the folder
   * @public
   * @returns {string}
   * @memberof PdfFileTextOut
   */
  public getNameOfFileOnly(): string {
    const arrayDir = this.outputFile.split('/');
    let result = this.outputFile;
    if (arrayDir.length > 1) {
      result = arrayDir[arrayDir.length - 1];
    }
    return result;
  }
  /**
   *
   * adds the style into the html doc
   */
  public addStyle(dochtml: string): string {
    let docWithStyle =
      `<!DOCTYPE html>
                <html>
                <head>
                <title>Output</title>
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
                    width:90%;
                }

                </style>
                </head>
                <body>
                ` +
      dochtml +
      `
                </body>
                </html>`;
    return docWithStyle;
  }

  /**
   * moveTheImages
   * Move the images and remove the folder
   * @public
   * @returns {Promise<void>}
   * @memberof PdfFileTextOut
   */
  public async moveTheImages(): Promise<void> {
    if (await EmitElement.dirExists('imageTemp')) {
      try {
        await extrafs.copy('./imageTemp', './');
        await extrafs.remove('imageTemp');
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
