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
import { emit } from 'cluster';
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
        outputString.push('\n\n<<<<\n\n');
      }
      const dochtml = this.asciidoctor.convert(outputString.join(''), {
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
      //pdf only works in the project folder
      const fileName = this.getNameOfFileOnly();
      const htmlToPdf = require('html-to-pdf');
      htmlToPdf.setInputEncoding('UTF-8');
      htmlToPdf.setOutputEncoding('UTF-8');
      try {
        htmlToPdf.convertHTMLString(
          docWithStyle,
          fileName + '.pdf',
          async (error: any, success: any) => {
            if (error) {
              console.log(error);
            }
            if (success) {
              //we move the path to the user output path
              try {
                this.createPdfInRightFolder(fileName);
              } catch (error) {
                console.log(error);
              }
            }
          },
        );
      } catch (error) {
        console.log(error + ' can not create pdf in the project folder');
      }
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
   * moveTheImages
   * Move the images and remove the folder
   * @public
   * @returns {boolean}
   * @memberof PdfFileTextOut
   */
  public async createPdfInRightFolder(filename: string) {
    try {
      let copyPromisify = util.promisify(fs.copyFile);
      await copyPromisify(filename + '.pdf', this.outputFile + '.pdf');
    } catch (e) {
      throw e;
    }
    try {
      let unlinkPromisify = util.promisify(fs.unlink);
      await unlinkPromisify(filename + '.pdf');
    } catch (e) {
      throw e;
    }
  }
  /**
   * moveTheImages
   * Move the images and remove the folder
   * @public
   * @returns {Promise<void>}
   * @memberof PdfFileTextOut
   */
  public async moveTheImages(): Promise<void> {
    if (EmitElement.dirExists('./imageTemp/')) {
      try {
        let copyPromisify = util.promisify(extrafs.copy);
        await copyPromisify('./imageTemp', './');
        shelljs.rm('-rf', 'imageTemp');
      } catch (err) {
        console.log(err.message);
      }
    }
  }
}
