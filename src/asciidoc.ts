import { DocConfig, IndexSource, Index, TextOut, TextIn, Transcript, Paragraph, TextSegment, TextElement, InlineImage, TextInSources, RichString, RichText, TextAttributes } from './types';
import * as fs from 'fs';

export class AsciiDocFileTextOut implements TextOut {

    public done: boolean = false;
    private outputFile: string;

    public constructor(file: string) {
        this.outputFile = file;
    }

    public async generate(data: Array<Transcript>): Promise<void> {

        let outputString = ':toc: macro\ntoc::[]\n\n';

        if (data.length < 1) {
            throw new Error('No Text instances passed');
        } else {
            for (const node of data){
                for (const segment of node.segments) {

                    if (segment.kind === 'textelement') {
                        outputString = outputString + this.textElementParsed(segment) + '\n\n';
                    } else if (segment.kind === 'paragraph') {
                        outputString = outputString + this.paragraphParsed(segment) + '\n\n';
                    } else if (segment.kind === 'inlineimage') {
                        outputString = outputString + this.imageParsed(segment) + '\n\n';
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
            const attrs = content.attrs;
            let text = content.text;
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
        return output;
    }

    private imageParsed(myText: InlineImage){
        return 'image::' + myText.img + '[' + myText.title + ']';
    }

}

export class AsciiDocFileTextIn implements TextIn {

    public  base: string;
    public asciidoctor = require('asciidoctor.js')();
    public htmlparse = require('html-parse');

    public constructor(basepath: string) {
        this.base = basepath;
    }

    public async getTranscript(id: string, sections?: string[]): Promise<Transcript> {

        const dir = this.base + '/' + id;

        const doc = fs.readFileSync(dir, 'utf-8');

        const dochtml = this.asciidoctor.convert(doc);
        //console.log(dochtml);

        const tree = this.htmlparse.parse(dochtml);

        let transcript: Transcript = { segments: [] };
        let end: Array<TextSegment> = [];

        for (const branch of tree) {
            let temp = this.recursive(branch, sections);
            for (const final of temp) {
                end.push(final);
            }
        }

        transcript.segments = end;

        // console.dir(JSON.stringify(transcript));

        return transcript;

    }

    public recursive(node: any, filter?: string[]): Array<TextSegment> {
        //console.log(params);
        let result: Array<TextSegment> = [];
        let out: TextSegment;
        if (node.children) {
            if (node.name === 'title') {

                out = { kind: 'textelement', element: 'title', text: this.pharagraphs(node.children) };
                result.push(out);

            } else if (node.name === 'h1') {

                out = { kind: 'textelement', element: 'h1', text: this.pharagraphs(node.children) };
                result.push(out);

            } else if (node.name === 'h2') {

                out = { kind: 'textelement', element: 'h2', text: this.pharagraphs(node.children) };
                result.push(out);

            } else if (node.name === 'h3') {

                out = { kind: 'textelement', element: 'h3', text: this.pharagraphs(node.children) };
                result.push(out);

            } else if (node.name === 'h4') {

                out = { kind: 'textelement', element: 'h4', text: this.pharagraphs(node.children) };
                result.push(out);

            }
            if (filter !== [] && filter !== null && filter !== undefined) {
                let sectionFound = false;
                for (const section of filter) {
                    if (node.children[0].data === section) {
                        sectionFound = true;
                    }
                }

                if (sectionFound) {
                    result.pop();
                    let inter = this.recursive(node.parent);
                    if (inter && inter.length > 0) {
                        for (const temp of inter) {
                            result.push(temp);
                        }
                    }

                } else {
                    for (const child of node.children) {
                        let inter = this.recursive(child, filter);
                        if (inter && inter.length > 0) {
                            for (const temp of inter) {
                                result.push(temp);
                            }
                        }
                    }
                }

            } else {
                if (node.name === 'p') {
                    out = { kind: 'paragraph', text: this.pharagraphs(node.children) };
                    for (const temp of out.text) {
                        // console.log(temp.text);
                    }
                    result.push(out);

                } else if (node.name === 'img') {
                    let img: InlineImage = {
                        kind: 'inlineimage',
                        img: node.attribs.src,
                        title: node.attribs.alt
                    };
                    result.push(img);

                } else {
                    for (const child of node.children) {
                        let inter = this.recursive(child);
                        if (inter && inter.length > 0) {
                            // console.log('Concat recursive: (Node length: ' + node.children.length + ')'); // OK? NO! Concat the same value for
                            // console.dir(inter[0], { depth: null });
                            for (const temp of inter) {
                                result.push(temp);
                            }
                        }
                    }
                }
            }
        }

        return result;
    }

    public pharagraphs( node: Array<any>): RichText {

        let result: RichText = [];
        //console.log('My params ' + myParams + '\n');
        //console.dir(node, { depth: null });
        for (const child of node) {
            if (child.children) {
                let para = this.pharagraphs(child.children);

                if (child.name) {
                    let newParam = child;

                    if (child.name === 'span' && child.attribs.class === 'underline') {
                        newParam.name = 'underline';
                    }
                    para = this.putMyAttribute(para, newParam.name);
                }
                if (para && para.length > 0) {
                    //console.log('Concat paragraph: (Node length: ' + para.length + ')'); // OK
                    // console.dir(para, { depth: null });
                    for (const temp of para) {
                        result.push(temp);
                    }
                }

            } else if (child.data !== '\n' && child.data !== '' && child.data !== ' ') {
                let attrs: TextAttributes = {
                    strong: false,  // "bold"
                    cursive: false,   // "italic"
                    underline: false,
                    script: 'normal'
                };
                let out: RichString = {
                    text: '',
                    attrs: attrs
                };

                out.text = child.data;
                out.attrs = attrs;
                // console.dir(out, { depth: null });  // <------
                result.push(out);

            }
        }
        return result;

    }
    public putMyAttribute(para: RichText, myParam: string): RichText {
        let paragraph: RichText = [];
        // console.log(myParam);
        // tslint:disable-next-line:forin
        for (const par of para) {
            if (myParam === 'strong') {
                par.attrs.strong = true;
            } else if (myParam === 'em') {
                par.attrs.cursive = true;
            } else if (myParam === 'underline') {
                par.attrs.underline = true;
            } else if (myParam === 'sub') {
                par.attrs.script = 'sub';
            } else if (myParam === 'sup') {
                par.attrs.script = 'super';
            }
            paragraph.push(par);
        }

        return paragraph;
    }

}