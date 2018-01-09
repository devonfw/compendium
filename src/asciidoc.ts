import { DocConfig, IndexSource, Index, TextOut, TextIn, Transcript, Paragraph, TextSegment, TextElement, InlineImage, TextInSources } from './types';
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

class IR {
    public symbol: string;
    public value: string;
}

export class AsciiDocFileTextIn implements TextIn {

    public  base: string;
    public asciidoctor = require('asciidoctor.js')();

    public constructor(basepath: string) {
        this.base = basepath;
    }

    public async getTranscript(id: string): Promise<Transcript> {
        const dir = this.base + '/' + id;
        const doc = fs.readFileSync(dir, 'utf-8');
        console.log(doc + '\n\r');
        let html = this.asciidoctor.convert(doc);

        //let transcript: Transcript;

        let segments: Array<TextSegment>;

        html = html.split('<span class="underline">').join('<u>');
        html = html.split('</span>').join('</u>');

        html = html.split('>').join('> ');
        html = html.split('<').join(' <');
        html = html.split('   ').join(' ');
        html = html.split('  ').join(' ');
        html = html.split(' \n ').join('\n');
        html = html.split('</div>').join('');

        console.log(html);
        const resource = html.split('\n');

        for (const line of resource){

            let ir: Array<IR> = [];

            if (line.substring(0, 4) === '<div' || line === '</div>'){
                // nothing to do here
            } else {

                const splitLine = line.split(' ');
                // console.log(JSON.stringify(splitLine));
                for (const block of splitLine) {
                    if (block.substring(0, 3) === 'id=') {
                        // nothing to do
                    }else if (block.substring(0, 3) === '<h1') {
                        ir.push(this.createSymbol('title_op', block));
                    } else if (block.substring(0, 3) === '<h2') {
                        ir.push(this.createSymbol('h1_op', block));
                    } else if (block.substring(0, 3) === '<h3') {
                        ir.push(this.createSymbol('h2_op', block));
                    } else if (block.substring(0, 3) === '<h4') {
                        ir.push(this.createSymbol('h3_op', block));
                    } else if (block.substring(0, 3) === '<h5') {
                        ir.push(this.createSymbol('h4_op', block));
                    } else if (block === '</h1>') {
                        ir.push(this.createSymbol('title_end', block));
                    } else if (block === '</h2>') {
                        ir.push(this.createSymbol('h1_end', block));
                    } else if (block === '</h3>') {
                        ir.push(this.createSymbol('h2_end', block));
                    } else if (block === '</h4>') {
                        ir.push(this.createSymbol('h3_end', block));
                    } else if (block === '</h5>') {
                        ir.push(this.createSymbol('h4_end', block));
                    } else if (block === '<strong>') {
                        ir.push(this.createSymbol('strong_op', block));
                    } else if (block === '</strong>') {
                        ir.push(this.createSymbol('strong_end', block));
                    } else if (block === '<em>') {
                        ir.push(this.createSymbol('cursive_op', block));
                    } else if (block === '</em>') {
                        ir.push(this.createSymbol('cursive_end', block));
                    } else if (block === '<u>') {
                        ir.push(this.createSymbol('underline_op', block));
                    } else if (block === '</u>') {
                        ir.push(this.createSymbol('underline_end', block));
                    } else if (block === '<sub>') {
                        ir.push(this.createSymbol('sub_op', block));
                    } else if (block === '</sub>') {
                        ir.push(this.createSymbol('sub_end', block));
                    } else if (block === '<p>') {
                        ir.push(this.createSymbol('p_op', block));
                    } else if (block === '</p>') {
                        ir.push(this.createSymbol('p_end', block));
                    } else {
                        ir.push(this.createSymbol('text', block));
                        console.log(block);
                    }
                }
                console.log(JSON.stringify(ir) + '\n');
            }
        }
        const transcript: Transcript = {
            segments: [
                {
                    kind: 'textelement',
                    element: 'h1',
                    text: 'The fox',
                },
            ]};
        return transcript;
    }
    private createSymbol(symbol: string, value: string): IR {
        let obj: IR = new IR();
        obj.symbol = symbol;
        obj.value = value;

        return obj;
    }

}