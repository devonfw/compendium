import { TextOut, Transcript, TextElement, Paragraph, InlineImage, List, RichText, TableBody, RichString } from './types';
import * as fs from 'fs';

export class HtmlFileTextOut implements TextOut {

    public done: boolean = false;
    public asciidoctor = require('asciidoctor.js')();
    private outputFile: string;

    public constructor(file: string) {
        this.outputFile = file;
    }

    public async generate(data: Array<Transcript>): Promise<void> {

        let outputString = ':toc: macro\ntoc::[]\n\n';

        if (data.length < 1) {
            throw new Error('No Text instances passed');
        } else {
            for (const node of data) {
                for (const segment of node.segments) {

                    if (segment.kind === 'textelement') {
                        outputString = outputString + this.textElementParsed(segment) + '\n\n';
                    } else if (segment.kind === 'paragraph') {
                        outputString = outputString + this.paragraphParsed(segment) + '\n\n';
                    } else if (segment.kind === 'inlineimage') {
                        outputString = outputString + this.imageParsed(segment) + '\n\n';
                    } else if (segment.kind === 'table') {
                        outputString = outputString + this.tableParsed(segment.content) + '\n\n';
                    } else if (segment.kind === 'list') {
                        outputString = outputString + this.listParsed(segment) + '\n\n';
                    }
                }
            }
            // console.log(outputString);
            fs.writeFile(this.outputFile + '.adoc', outputString, (err) => { if (err) throw new Error(err.message); });
        }

        this.done = true;
    }

    private textElementParsed(myText: TextElement) {
        const textelement = myText.element;
        if (textelement === 'title') { return '= ' + this.paragraphParsed(myText); }
        if (textelement === 'h1') { return '= ' + this.paragraphParsed(myText); }
        if (textelement === 'h2') { return '== ' + this.paragraphParsed(myText); }
        if (textelement === 'h3') { return '=== ' + this.paragraphParsed(myText); }
        if (textelement === 'h4') { return '==== ' + this.paragraphParsed(myText); }
    }
    private paragraphParsed(myText: Paragraph | TextElement) {
        let output: string = '';
        for (const content of myText.text) {

            if ((content as InlineImage).kind === 'inlineimage') {
                output = output + this.imageParsed((content as InlineImage));

            } else if ((content as RichString).text) {

                const attrs = (content as RichString).attrs;
                let text = (content as RichString).text;
                let blankFirst = false, blankLast = false;

                if (text.charAt(text.length - 1) === ' ') {
                    blankLast = true;
                }
                if (text.charAt(0) === ' ') {
                    blankFirst = true;
                }
                text = text.trim();

                if (attrs.underline) { text = '[.underline]#' + text + '#'; }
                if (attrs.cursive) { text = '_' + text + '_'; }
                if (attrs.strong) { text = '*' + text + '*'; }
                if (attrs.script === 'normal') {
                    text = text;
                } else if (attrs.script === 'sub') {
                    text = '~' + text + '~';
                } else if (attrs.script === 'super') {
                    text = '^' + text + '^';
                }

                if (blankLast) {
                    text = text + ' ';
                }
                if (blankFirst) {
                    text = ' ' + text;
                }
                if (output === '') {
                    output = text;
                } else {
                    if (output.charAt(output.length - 1) !== ' ' && text.charAt(0) !== ' ') {
                        output = output + ' ';
                    }
                    output = output + text;
                }
            }
        }
        return output;
    }

    private imageParsed(myText: InlineImage) {
        return 'image::' + myText.img + '[' + myText.title + ']';
    }

    private tableParsed(content: TableBody) {
        let output: string;
        output = '|==================\n';
        for (const row of content.body) {
            for (const cell of row) {
                for (const inside of cell.cell) {
                    if (inside.kind === 'paragraph') {
                        output = output;
                        output = output + '| ' + this.paragraphParsed(inside) + ' ';
                    } else if (inside.kind === 'inlineimage') {
                        output = output + 'a| ' + this.imageParsed(inside) + ' ';
                    } else if (inside.kind === 'table') {
                        output = output + 'a| ' + this.tableParsed(inside.content) + ' ';
                    } else if (inside.kind === 'list') {
                        output = output + 'a| ' + this.listParsed(inside) + ' ';
                    }
                }
            }
            output = output + '\n';
        }
        output = output + '|==================\n';
        return output;
    }

    private listParsed(list: List, notation?: string) {
        let output: string = '';
        if (!notation) {
            notation = '*';
            if (list.ordered) {
                notation = '.';
            }
        } else {

            if (list.ordered) {
                notation = notation + '.';
            } else {
                notation = notation + '*';
            }
        }
        for (const element of list.elements) {
            if ((element as List).kind === 'list') {
                output = output + this.listParsed((element as List), notation);
            } else if ((element as Paragraph).kind === 'paragraph') {
                output = output + notation + ' ' + this.paragraphParsed((element as Paragraph)) + '\n';
            } else if ((element as RichText)[0]) {
                const temp: Paragraph = { kind: 'paragraph', text: (element as RichText) };
                output = output + notation + ' ' + this.paragraphParsed(temp) + '\n';
            }
        }
        return output;
    }

}