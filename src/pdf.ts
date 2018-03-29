import { TextOut, Transcript, TextElement, Paragraph, InlineImage, List, RichText, TableBody, RichString, Link, Code, Table } from './types';
import { EmitElement } from './emitFunctions';
import { Utilities } from './utils';
import * as fs from 'fs';
import { emit } from 'cluster';
import * as ncp from 'ncp';
import * as shelljs from 'shelljs';

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
            const dochtml = this.asciidoctor.convert(outputString.join(''), { attributes: { showtitle: true, doctype: 'book' } });
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
                ` + dochtml + `
                </body>
                </html>`;
            const htmlToPdf = require('html-to-pdf');
            htmlToPdf.setInputEncoding('UTF-8');
            htmlToPdf.setOutputEncoding('UTF-8');
            htmlToPdf.convertHTMLString(docWithStyle, this.outputFile + '.pdf', (error: any, success: any) => {
                if (error) {
                    console.log(error);
                }
            });
        }
        this.done = true;
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
            const arrayDir = this.outputFile.split('/');
            let outputDir: string = '';
            if (arrayDir.length > 1) {
                arrayDir.splice(-1, 1);
                for (const piece of arrayDir) {
                    outputDir = outputDir + piece;
                }
            }
            try {
                ncp.ncp('./imageTemp/', outputDir, (err: Error) => {
                    if (err) {
                        return console.error(err);
                    }
                    shelljs.rm('-rf', 'imageTemp');
                });
            } catch (err) {
                console.log(err.message);
            }
        }
    }
}