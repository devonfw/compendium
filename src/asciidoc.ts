import { DocConfig, IndexSource, Index, TextOut, TextIn, Transcript, Paragraph, TextSegment, TextElement, InlineImage, TextInSources, RichString, RichText, TextAttributes, Table, TableBody, Col, Row, Cell, TableSegment, List, Link } from './types';
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
                    } else if (segment.kind === 'table') {
                        outputString = outputString + this.tableParsed(segment.content) + '\n\n';
                    } else if (segment.kind === 'list') {
                        outputString = outputString + this.listParsed(segment) + '\n\n';
                    } else if (segment.kind === 'link') {
                        outputString = outputString + this.linkParsed(segment) + '\n\n';
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

            } else if ((content as Link).kind === 'link') {
                output = output + this.linkParsed((content as Link));
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

    private linkParsed(myLink: Link) {
        let output: string = '';
        if ((myLink.text as InlineImage).kind === 'inlineimage'){
            output = 'image::' + (myLink.text as InlineImage).img + '[' + (myLink.text as InlineImage).title + ', link="' + myLink.ref + '"]';
        } else {
            output = 'link:' + myLink.ref + '[' + this.paragraphParsed((myLink.text as Paragraph)) + ']';
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
                if (cell.colspan && cell.colspan !== '1') {
                    output = output + cell.colspan + '+^';
                }
                for (const inside of cell.cell) {
                    if (inside.kind === 'paragraph') {
                        output = output ;
                        output = output + '| ' + this.paragraphParsed(inside) + ' ';
                    } else if (inside.kind === 'inlineimage') {
                        output = output + 'a| ' + this.imageParsed(inside) + ' ';
                    } else if (inside.kind === 'table') {
                        output = output + 'a| ' + this.tableParsed(inside.content) + ' ';
                    } else if (inside.kind === 'list') {
                        output = output + 'a| ' + this.listParsed(inside) + ' ';
                    } else if (inside.kind === 'link') {
                        output = output + 'a| ' + this.linkParsed(inside) + ' ';
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
            if ((element as List).kind === 'list'){
                output = output + this.listParsed((element as List), notation);
            } else if ((element as Link).kind === 'link') {
                output = output + this.linkParsed((element as Link));
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

export class AsciiDocFileTextIn implements TextIn {

    public  base: string;
    public asciidoctor = require('asciidoctor.js')();
    public htmlparse = require('html-parse');

    public constructor(basepath: string) {
        this.base = basepath;
    }

    public async getTranscript(id: string, sections?: string[]): Promise<Transcript> {

        const dir = this.base + '/' + id;
        let doc;

        try {
            doc = fs.readFileSync(dir, 'utf-8');
        } catch (err) {
            if (err.code === 'ENOENT') {
                err.message = 'File ' + id + ' in ' + dir + ' not found.';
                throw err;
            } else {
                throw err;
            }
        }
        doc = doc.replace(':toc: macro', '');
        doc = doc.replace('toc::[]', '');
        //console.log(doc);
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

        //console.dir(JSON.stringify(transcript));

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
                    result.push(out);

                } else if (node.name === 'a') {
                    out = { kind: 'link', ref: node.attribs.href, text: this.linkContent(node.children) };
                    result.push(out);
                } else if (node.name === 'img') {
                    const img: InlineImage = {
                        kind: 'inlineimage',
                        img: node.attribs.src,
                        title: node.attribs.alt,
                    };
                    result.push(img);
                } else if (node.name === 'table') {

                    out = { kind: 'table', content: this.table(node.children) };
                    result.push(out);

                } else if (node.name === 'ul') {

                    out = { kind: 'list', ordered: false, elements: this.list(node.children) };
                    result.push(out);

                } else if (node.name === 'ol') {

                    out = { kind: 'list', ordered: true, elements: this.list(node.children) };
                    result.push(out);

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

    public linkContent(node: Array<any>): Paragraph | InlineImage {
        let result: Paragraph | InlineImage;
        if (node.length === 1 && node[0].name === 'img') {
            const img: InlineImage = {
                kind: 'inlineimage',
                img: node[0].attribs.src,
                title: node[0].attribs.alt,
            };
            result = img;
        } else {
            const out: Paragraph = { kind: 'paragraph', text: this.pharagraphs(node) };
            result = out;
        }

        return result;
    }

    public list(node: Array<any>): Array<RichText | List | Paragraph | Link> {
        let result: Array<RichText | List | Paragraph | Link> = [];
        let out: RichText | List | Paragraph | Link;
        for (const li of node) {
            if (li.name === 'li') {
                for (const child of li.children)
                    if (child.type === 'text' && child.data !== '\n') {
                        out = this.pharagraphs([child]);
                        result.push(out);
                    } else if (child.name === 'ul') {
                        out = { kind: 'list', ordered: false, elements: this.list(child.children) };
                        result.push(out);
                    } else if (child.name === 'ol') {
                        out = { kind: 'list', ordered: true, elements: this.list(child.children) };
                        result.push(out);
                    } else if (child.name === 'p') {
                        out = { kind: 'paragraph', text: this.pharagraphs(child.children) };
                        result.push(out);
                    } else if (child.name === 'div') {
                        for (const element of child.children) {
                            if (element.name === 'ol'){
                                out = { kind: 'list', ordered: true, elements: this.list(element.children) };
                                result.push(out);
                            } else if (element.name === 'ul') {
                                out = { kind: 'list', ordered: false, elements: this.list(element.children) };
                                result.push(out);
                            }
                        }
                    } else if (child.name === 'a') {
                        out = { kind: 'link', ref: child.attribs.href, text: this.linkContent(child.children) };
                        result.push(out);
                    } else if (!child.data){
                        out = this.pharagraphs(child.children);
                        result.push(out);
                    }
            }
        }
        return result;
    }

    public table(node: Array<any>): TableBody {

        let result: TableBody;
        let colspan: Array<Col>;
        let colRow: Array<Col> = [];
        let bodyRows: Array<Row> = [];

        for (const child of node) {
            if (child.name === 'tbody') {
                for (const row of child.children) {
                    if (row.name === 'tr') {
                        let resultRow: Row = [];
                        for (const cell of row.children) {
                            let element: Cell;
                            let colespan: string = '1';

                            if (cell.name === 'th') {
                                if (cell.attribs.colspan) {
                                    colespan = cell.attribs.colspan;
                                }
                                if (cell.children && cell.children.length > 0 && cell.children[0].name !== 'br') {
                                    const p: Paragraph = { kind: 'paragraph', text: this.pharagraphs(cell.children) };
                                    element = { type: 'th', colspan: colespan, cell: [p] };
                                } else {
                                    const p: Paragraph = { kind: 'paragraph', text: this.pharagraphs([{ data: ' ', type: 'text' }]) };
                                    element = { type: 'th', colspan: colespan, cell: [p] };
                                }
                                resultRow.push(element);
                            } else if (cell.name === 'td') {
                                if (cell.attribs.colspan) {
                                    colespan = cell.attribs.colspan;
                                }
                                if (cell.children && cell.children.length > 0 && cell.children[0].name !== 'br') {
                                    // console.dir(cell.children);
                                    const contentCell = this.tableTd(cell.children);
                                    if (contentCell) {
                                        element = { type: 'td', colspan: colespan, cell: contentCell };
                                        resultRow.push(element);
                                    }
                                } else {
                                    const p: Paragraph = { kind: 'paragraph', text: this.pharagraphs([{ data: ' ', type: 'text' }]) };
                                    element = { type: 'td', colspan: colespan, cell: [p] };
                                    resultRow.push(element);
                                }
                            }
                        }
                        bodyRows.push(resultRow);
                    }
                }

            } else if (child.name === 'colgroup') {
                for (const col of child.children) {
                    let element: Col;
                    let colespan: string = '\\"1\\"';

                    if (col.name === 'col') {
                        if (col.attribs.colespan) {
                            colespan = col.attribs.colespan;
                        }

                        element = {
                            span: colespan,
                            style: col.attribs.style,
                        };
                        colRow.push(element);
                    }
                }
            } else if (child.name === 'tr') {
                let resultRow: Row = [];
                for (const cell of child.children) {
                    let element: Cell;
                    let colespan: string = '1';

                    if (cell.name === 'th') {
                        if (cell.attribs.colspan) {
                            colespan = cell.attribs.colspan;
                        }
                        if (cell.children && cell.children.length > 0 && cell.children[0].name !== 'br') {
                            const p: Paragraph = { kind: 'paragraph', text: this.pharagraphs(cell.children) };
                            element = { type: 'th', colspan: colespan, cell: [p] };
                        } else {
                            const p: Paragraph = { kind: 'paragraph', text: this.pharagraphs([{ data: ' ', type: 'text' }]) };
                            element = { type: 'th', colspan: colespan, cell: [p] };
                        }
                        resultRow.push(element);
                    } else if (cell.name === 'td') {
                        if (cell.attribs.colspan) {
                            colespan = cell.attribs.colspan;
                        }
                        if (cell.children && cell.children.length > 0 && cell.children[0].name !== 'br') {
                            const contentCell = this.tableTd(cell.children);
                            if (contentCell) {
                                element = { type: 'td', colspan: colespan, cell: contentCell };
                                resultRow.push(element);
                            }
                        } else {
                            const p: Paragraph = { kind: 'paragraph', text: this.pharagraphs([{ data: ' ', type: 'text' }]) };
                            element = { type: 'td', colspan: colespan, cell: [p] };
                            resultRow.push(element);
                        }
                    }
                }
                bodyRows.push(resultRow);
            }
        }

        result = {
            colgroup: colRow,
            body: bodyRows,
        };

        return result;
    }

    public tableTd(node: any): Array<TableSegment>{
        let result: Array<TableSegment> = [];
        for (const child of node) {
            let out: TableSegment;
            if (child.name === 'p') {
              out = { kind: 'paragraph', text: this.pharagraphs(child.children) };
              result.push(out);
            } else if (child.name === 'img') {
              let img: InlineImage = { kind: 'inlineimage', img: child.attribs.src, title: child.attribs.alt };
              result.push(img);
            } else if (child.name === 'table') {
              out = { kind: 'table', content: this.table(child.children) };
              result.push(out);
            } else if (child.name === 'span') {
              out = { kind: 'paragraph', text: this.pharagraphs(child.children) };
              result.push(out);
            } else if (child.name === 'ul') {
              out = { kind: 'list', ordered: false, elements: this.list(child.children) };
              result.push(out);
            } else if (child.name === 'ol') {
              out = { kind: 'list', ordered: true, elements: this.list(child.children) };
              result.push(out);
            } else if (node.name === 'a') {
              out = { kind: 'link', ref: node.attribs.href, text: this.linkContent(node.children) };
              result.push(out);
            } else if (child.name === 'div') {
              if (child.children) {
                for (const element of child.children) {
                  if (element.children) {
                    const temp: Array<TableSegment> = this.tableTd(element.children);
                    for (const inside of temp) {
                      result.push(inside);
                    }
                  } else if (element.type === 'text') {
                    const p: Paragraph = { kind: 'paragraph', text: this.pharagraphs(
                        [element]
                      ) };
                    result.push(p);
                  }
                }
              }
            } else if (child.type === 'text' && child.data !== '\n') {
              const p: Paragraph = { kind: 'paragraph', text: this.pharagraphs([child]) };
              result.push(p);
            }
        }

        return result;
    }

    public pharagraphs( node: Array<any>): RichText {

        let result: RichText = [];
        //console.log('My params ' + myParams + '\n');
        //console.dir(node, { depth: null });
        for (const child of node) {
            if (child.name === 'img') {
                const img: InlineImage = {
                    kind: 'inlineimage',
                    img: child.attribs.src,
                    title: child.attribs.alt,
                };
                result.push(img);
            } else if (child.name === 'a') {
                const out: Link = { kind: 'link', ref: child.attribs.href, text: this.linkContent(child.children) };
                result.push(out);
            } else if (child.children) {
                let para: Array<RichString | InlineImage | Link> = this.pharagraphs(child.children);

                if (child.name) {
                    const newParam = child;

                    if (child.name === 'span' && child.attribs.class === 'underline') {
                        newParam.name = 'underline';
                    }
                    para = this.putMyAttribute((para as Array<RichString>), newParam.name);
                }
                if (para && para.length > 0) {
                    //console.log('Concat paragraph: (Node length: ' + para.length + ')'); // OK
                    // console.dir(para, { depth: null });
                    for (const temp of para) {
                        result.push(temp);
                    }
                }

            } else if (child.data !== '\n' && child.data !== '' && child.data !== ' ') {
                     const attrs: TextAttributes = { strong: false, cursive: false, underline: false, script: 'normal' }; // "bold" // "italic"
                     const out: RichString = { text: '', attrs: attrs };

                     out.text = child.data;
                     out.attrs = attrs;
                     // console.dir(out, { depth: null });  // <------
                     result.push(out);
                   }
        }
        return result;

    }
    public putMyAttribute(para: Array<RichString>, myParam: string): Array<RichString> {
        let paragraph: Array<RichString> = [];
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