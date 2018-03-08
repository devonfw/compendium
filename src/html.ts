import { TextOut, Transcript, TextElement, Paragraph, InlineImage, List, RichText, TableBody, RichString, Link, Code, Table } from './types';
import * as fs from 'fs';

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

        if (this.dirExists('./imageTemp/')) {
            const arrayDir = this.outputFile.split('/');
            let outputDir: string = '';
            if (arrayDir.length > 1) {
                arrayDir.splice(-1, 1);
                for (const piece of arrayDir) {
                  outputDir = outputDir + piece;
                }
            }
            try {
            const ncp = require('ncp').ncp;
            ncp('./imageTemp/', outputDir, (err: Error) => {
                if (err) {
                return console.error(err);
                }
                const shell = require('shelljs');
                shell.rm('-rf', 'imageTemp');
            });
            } catch (err) {
            console.log(err.message);
            }
        }

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
                    } else if (segment.kind === 'link') {
                        outputString = outputString + this.linkParsed(segment) + '\n\n';
                    } else if (segment.kind === 'code') {
                        outputString = outputString + this.codeParsed(segment) + '\n\n';
                    }
                }
                outputString = outputString + '\n\n';
            }
            outputString = this.asciidoctor.convert(outputString, { attributes: { showtitle: true, doctype: 'book' } });
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
            ` + outputString + `
            </body>
            </html>`;
            try {
                fs.writeFileSync(this.outputFile + '.html', outputString, {encoding: 'utf8'});
            } catch (err) {
                throw err;
            }
        }

        this.done = true;
    }
/**
 * codeParsed
 * Parse the parts with code
 * @private
 * @param {Code} myText
 * @returns
 * @memberof HtmlFileTextOut
 */
private codeParsed(myText: Code) {
        let out: string = '';
        if (myText.languaje) {
            out = '```' + myText.languaje + '\n' + myText.content + '\n```';
        } else {
            out = '`' + myText.content + '`';
        }

        return out;
    }
    /**
     * textElementParsed
     * Parse the different textElement
     * @private
     * @param {TextElement} myText
     * @returns
     * @memberof HtmlFileTextOut
     */
    private textElementParsed(myText: TextElement) {
        const textelement = myText.element;
        if (textelement === 'title') { return '= ' + this.paragraphParsed(myText); }
        if (textelement === 'h1') { return '== ' + this.paragraphParsed(myText); }
        if (textelement === 'h2') { return '=== ' + this.paragraphParsed(myText); }
        if (textelement === 'h3') { return '==== ' + this.paragraphParsed(myText); }
        if (textelement === 'h4') { return '===== ' + this.paragraphParsed(myText); }
    }
    /**
     * paragraphParsed
     * Parse the content that you can find in a paragraph
     * @private
     * @param {(Paragraph | TextElement)} myText
     * @returns
     * @memberof HtmlFileTextOut
     */
    private paragraphParsed(myText: Paragraph | TextElement) {
        let output: string = '';
        for (const content of myText.text) {

            if ((content as InlineImage).kind === 'inlineimage') {
                output = output + this.imageParsed((content as InlineImage));

            } else if ((content as Link).kind === 'link') {
                output = output + this.linkParsed((content as Link));
            } else if ((content as Code).kind === 'code') {
                output = output + this.codeParsed((content as Code));
            } else if ((content as Table).kind === 'table') {
                output = output + this.tableParsed((content as Table).content);
            } else if ((content as RichString).text) {

                const attrs = (content as RichString).attrs;
                let text = (content as RichString).text;
                let blankFirst = false, blankLast = false;

                if (text.charAt(text.length - 1) === ' '){
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
    /**
     * linkParsed
     * Parse the links or inlineImage
     * @private
     * @param {Link} myLink
     * @returns
     * @memberof HtmlFileTextOut
     */
    private linkParsed(myLink: Link) {
        let output: string = '';
        if ((myLink.text as InlineImage).kind === 'inlineimage'){
            output = 'image::' + (myLink.text as InlineImage).img + '[' + (myLink.text as InlineImage).title + ', link="' + myLink.ref + '"]';
        } else {
            output = 'link:' + myLink.ref + '[' + this.paragraphParsed((myLink.text as Paragraph)) + ']';
        }
        return output;
    }
    /**
     * imageParsed
     * To parse the images
     * @private
     * @param {InlineImage} myText
     * @returns
     * @memberof HtmlFileTextOut
     */
    private imageParsed(myText: InlineImage) {
        return 'image::' + myText.img + '[' + myText.title + ']';
    }
    /**
     * tableParsed
     * To parse the table and the different elements that we can have inside.
     * @private
     * @param {TableBody} content
     * @returns
     * @memberof HtmlFileTextOut
     */
    private tableParsed(content: TableBody) {
        let output: string;
        if (content.body[0][0].type === 'th'){
            output = '[options="header"]\n';
        }
        output = '|==================\n';
        for (const row of content.body) {
            for (const cell of row) {
                if (cell.colspan && cell.colspan !== '1') {
                    output = output + cell.colspan + '+^';
                }
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
                    } else if (inside.kind === 'link') {
                      output = output + 'a| ' + this.linkParsed(inside) + ' ';
                    } else if (inside.kind === 'code') {
                      output = output + 'a| ' + this.codeParsed(inside) + ' ';
                    }
                }
            }
            output = output + '\n';
        }
        output = output + '|==================\n';
        return output;
    }
    /**
     * listParsed
     * To parse the list and the different element that we can find on it.
     * @private
     * @param {List} list
     * @param {string} [notation]
     * @returns
     * @memberof HtmlFileTextOut
     */
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
            if ((element as List).kind === 'list'){
                output = output + this.listParsed((element as List), notation);
            } else if ((element as Link).kind === 'link') {
                output = output + this.linkParsed((element as Link));
            } else if ((element as Paragraph).kind === 'paragraph') {
                output = output + notation + ' ' + this.paragraphParsed((element as Paragraph)) + '\n';
            } else if ((element as Code).kind === 'code') {
                output = output + this.codeParsed((element as Code));
            } else if ((element as RichText)[0]) {
                const temp: Paragraph = { kind: 'paragraph', text: (element as RichText) };
                output = output + notation + ' ' + this.paragraphParsed(temp) + '\n';
            }
        }
        return output;
    }
    /**
     * dirExists
     * Check if the directory exist
     * @private
     * @param {string} filename
     * @returns
     * @memberof HtmlFileTextOut
     */
    private dirExists(filename: string) {
    try {
        fs.accessSync(filename);
        return true;
    } catch (e) {
        return false;
    }
}

}