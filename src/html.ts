import { TextOut, Transcript, TextElement, Paragraph, InlineImage } from './types';
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
        let title = 'Compendium';

        if (data.length < 1) {
            throw new Error('No Text instances passed');
        } else {
            for (const node of data) {
                for (const segment of node.segments) {

                    if (segment.kind === 'textelement') {
                        if (segment.element === 'title') {
                            title = segment.text;
                        } else {
                            outputString = outputString + this.textElementParsed(segment) + '\n\n';
                        }
                    } else if (segment.kind === 'paragraph') {
                        outputString = outputString + this.paragraphParsed(segment) + '\n\n';
                    } else if (segment.kind === 'inlineimage') {
                        outputString = outputString + this.imageParsed(segment) + '\n\n';
                    }
                }
            }
            // console.log(outputString);
            let dochtml = this.asciidoctor.convert(outputString);
            dochtml = '<!DOCTYPE html>\n<html>\n<head>\n<meta charset="utf8"/>\n<title>' + title + '</title>\n</head>\n<body>\n' + dochtml + '</body>\n</html>';
            fs.writeFile(this.outputFile + '.html', dochtml, (err) => { if (err) throw new Error(err.message);});
        }

        this.done = true;
    }

    private textElementParsed(myText: TextElement) {
        const textelement = myText.element;
        if (textelement === 'h1') { return '= ' + myText.text; }
        if (textelement === 'h2') { return '== ' + myText.text; }
        if (textelement === 'h3') { return '=== ' + myText.text; }
        if (textelement === 'h4') { return '==== ' + myText.text; }
    }
    private paragraphParsed(myText: Paragraph) {
        let output: string = '';
        for (const content of myText.text) {
            const attrs = content.attrs;
            let text = content.text;
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
        return output;
    }

    private imageParsed(myText: InlineImage) {
        return 'image::' + myText.img + '[' + myText.title + ']';
    }

}