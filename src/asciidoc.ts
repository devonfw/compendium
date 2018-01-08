import { DocConfig, IndexSource, Index, TextOut, TextIn, Transcript, Paragraph, TextElement, InlineImage } from './types';
import * as fs from 'fs';

export class AsciiDocFileTextOut implements TextOut {

    public done: boolean = false;

    public async generate(data: Array<Transcript>): Promise<void> {

        let outputString = '';

        if (data.length < 1) {
            throw new Error('No Text instances passed');
        } else {
            for (const node of data){
                for (const segment of node.segments) {

                    if (segment.kind === 'textelement') {
                        outputString = outputString + this.textElementParsed(segment) + '\r\n';
                    } else if (segment.kind === 'paragraph') {
                        outputString = outputString + this.paragraphParsed(segment) + '\r\n';
                    } else if (segment.kind === 'inlineimage') {
                        outputString = outputString + this.imageParsed(segment) + '\r\n';
                    }
                }
            }
            console.log(outputString);
            fs.writeFile('result.asciidoc', outputString, (err) => { if (err) throw err; console.log('File created'); });
        }

        this.done = true;
    }

    private textElementParsed(myText: TextElement) {
        const textelement = myText.element;
        if (textelement === 'title') { return '= ' + myText.text; }
        if (textelement === 'h1') { return '== ' + myText.text; }
        if (textelement === 'h2') { return '=== ' + myText.text; }
        if (textelement === 'h3') { return '==== ' + myText.text; }
        if (textelement === 'h4') { return '===== ' + myText.text; }
    }
    private paragraphParsed(myText: Paragraph) {
        let output: string = '';
        for (const content of myText.text) {
            const attrs = content.attrs;
            let text = content.text;
            if (attrs.underline) { text = ':[underline]#' + text + '#'; }
            if (attrs.cursive) { text = '_' + text + '_'; }
            if (attrs.strong) { text = '*' + text + '*'; }
            if (attrs.script === 'normal') {
                text = ' ' + text + ' ';
            } else if (attrs.script === 'sub') {
                text = ' ~' + text + '~ ';
            } else if (attrs.script === 'super') {
                text = ' ^' + text + '^ ';
            } else {  }

            output = output + text;
        }
        return output;
    }

    private imageParsed(myText: InlineImage){
        return 'image::' + myText.img + '[' + myText.title + ']';
    }

}
