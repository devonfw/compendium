import { DocConfig, IndexSource, Index, TextOut, TextIn, Transcript, Paragraph, TextSegment, TextElement, InlineImage, TextInSources, RichString, RichText, TextAttributes, Table, TableBody, Col, Row, Cell, Code, TableSegment, List, Link } from './types';
import { EmitElement } from './emitFunctions';
import * as fs from 'fs';
import * as ncp from 'ncp';
import * as shelljs from 'shelljs';

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
            if (arrayDir.length > 1) {
                arrayDir.splice(-1, 1);
                for (const piece of arrayDir) {
                    outputDir.push(piece);
                }
            }
            try {
                ncp.ncp('./imageTemp/', outputDir[outputDir.length - 1], (err: Error) => {
                    if (err) {
                        return console.error(err);
                    }
                    shelljs.rm('-rf', 'imageTemp');
                });
            } catch (err) {
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
                fs.writeFileSync(this.outputFile + '.adoc', outputString.join(''));
            } catch (err) {
                throw err;
            }
        }
        this.done = true;
    }
}