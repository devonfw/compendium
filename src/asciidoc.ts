import { DocConfig, IndexSource, Index, TextOut, TextIn, Transcript, Paragraph, TextSegment, TextElement, InlineImage, TextInSources, RichString, RichText, TextAttributes, Table, TableBody, Col, Row, Cell, Code, TableSegment, List, Link } from './types';
import * as fs from 'fs';

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
            for (const node of data){
                for (const segment of node.segments) {

                    if (segment.kind === 'textelement') {
                        outputString = outputString + this.emitTextElement(segment) + '\n\n';
                    } else if (segment.kind === 'paragraph') {
                        outputString = outputString + this.emitParagraph(segment) + '\n\n';
                    } else if (segment.kind === 'inlineimage') {
                        outputString = outputString + this.emitImage(segment) + '\n\n';
                    } else if (segment.kind === 'table') {
                        outputString = outputString + this.emitTable(segment.content) + '\n\n';
                    } else if (segment.kind === 'list') {
                        outputString = outputString + this.emitList(segment) + '\n\n';
                    } else if (segment.kind === 'link') {
                        outputString = outputString + this.emitLink(segment) + '\n\n';
                    } else if (segment.kind === 'code') {
                        outputString = outputString + this.emitCode(segment) + '\n\n';
                    }
                }
                outputString = outputString + '\n\n';
            }
            try {
                fs.writeFileSync(this.outputFile + '.adoc', outputString);
            } catch (err) {
                throw err;
            }
        }
        this.done = true;
    }
    /**
     * emitCode
     * Parse the parts with code
     * @private
     * @param {Code} myText
     * @returns
     * @memberof AsciiDocFileTextOut
     */
    private emitCode(myText: Code) {
        let out: string = '';
        if (myText.language) {
            out = '```' + myText.language + '\n' + myText.content + '\n```';
        } else {
            out = '`' + myText.content + '`';
        }
        return out;
    }
    /**
     * emitTextElement
     * Parse the different textElement
     * @private
     * @param {TextElement} myText
     * @returns
     * @memberof AsciiDocFileTextOut
     */
    private emitTextElement(myText: TextElement) {
        const textelement = myText.element;
        if (textelement === 'title') { return '= ' + this.emitParagraph(myText); }
        if (textelement === 'h1') { return '== ' + this.emitParagraph(myText); }
        if (textelement === 'h2') { return '=== ' + this.emitParagraph(myText); }
        if (textelement === 'h3') { return '==== ' + this.emitParagraph(myText); }
        if (textelement === 'h4') { return '===== ' + this.emitParagraph(myText); }
    }
    /**
     * emitParagraph
     * Parse the content that you can find in a paragraph
     * @private
     * @param {(Paragraph | TextElement)} myText
     * @returns
     * @memberof AsciiDocFileTextOut
     */
    private emitParagraph(myText: Paragraph | TextElement) {
        let output: string = '';
        for (const content of myText.text) {
            if ((content as InlineImage).kind === 'inlineimage') {
                output = output + this.emitImage((content as InlineImage));
            } else if ((content as Link).kind === 'link') {
                output = output + this.emitLink((content as Link));
            } else if ((content as Code).kind === 'code') {
                output = output + this.emitCode((content as Code));
            } else if ((content as Table).kind === 'table') {
                output = output + this.emitTable((content as Table).content);
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
     * emitLink
     * Parse the links or inlineImage
     * @private
     * @param {Link} myLink
     * @returns
     * @memberof AsciiDocFileTextOut
     */
    private emitLink(myLink: Link) {
        let output: string = '';
        if ((myLink.text as InlineImage).kind === 'inlineimage'){
            output = 'image::' + (myLink.text as InlineImage).img + '[' + (myLink.text as InlineImage).title + ', link="' + myLink.ref + '"]';
        } else {
            output = 'link:' + myLink.ref + '[' + this.emitParagraph((myLink.text as Paragraph)) + ']';
        }
        return output;
    }
    /**
     * emitImage
     * To parse the images
     * @private
     * @param {InlineImage} myText
     * @returns
     * @memberof AsciiDocFileTextOut
     */
    private emitImage(myText: InlineImage) {
        return 'image::' + myText.img + '[' + myText.title + ']';
    }
    /**
     * emitTable
     * To parse the table and the different elements that we can have inside.
     * @private
     * @param {TableBody} content
     * @returns
     * @memberof AsciiDocFileTextOut
     */
    private emitTable(content: TableBody) {
        let output: string;
        // if (content.body[0][0].type === 'th'){
        //     output = '[options="header"]\n';
        // }
        output = '|==================\n';
        for (const row of content.body) {
            for (const cell of row) {
                if (cell.colspan && cell.colspan !== '1') {
                    output = output + cell.colspan + '+^';
                }
                for (const inside of cell.cell) {
                    if (inside.kind === 'paragraph') {
                      output = output;
                      output = output + '| ' + this.emitParagraph(inside) + ' ';
                    } else if (inside.kind === 'inlineimage') {
                      output = output + 'a| ' + this.emitImage(inside) + ' ';
                    } else if (inside.kind === 'table') {
                      output = output + 'a| ' + this.emitTable(inside.content) + ' ';
                    } else if (inside.kind === 'list') {
                      output = output + 'a| ' + this.emitList(inside) + ' ';
                    } else if (inside.kind === 'link') {
                        output = output + 'a| ' + this.emitLink(inside) + ' ';
                    } else if (inside.kind === 'code') {
                        output = output + 'a| ' + this.emitCode(inside) + ' ';
                    }
                }
            }
            output = output + '\n';
        }
        output = output + '|==================\n';
        return output;
    }
    /**
     * emitList
     * To parse the list and the different element that we can find on it.
     * @private
     * @param {List} list
     * @param {string} [notation]
     * @returns
     * @memberof AsciiDocFileTextOut
     */
    private emitList(list: List, notation?: string) {
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
                output = output + this.emitList((element as List), notation);
            } else if ((element as Link).kind === 'link') {
                output = output + this.emitLink((element as Link));
            } else if ((element as Paragraph).kind === 'paragraph') {
                output = output + notation + ' ' + this.emitParagraph((element as Paragraph)) + '\n';
            } else if ((element as Code).kind === 'code') {
                output = output + this.emitCode((element as Code));
            } else if ((element as RichText)[0]) {
                const temp: Paragraph = { kind: 'paragraph', text: (element as RichText) };
                output = output + notation + ' ' + this.emitParagraph(temp) + '\n';
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
     * @memberof AsciiDocFileTextOut
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

export class AsciiDocFileTextIn implements TextIn {

    public  base: string;
    public asciidoctor = require('asciidoctor.js')();
    public htmlparse = require('html-parse');

    public constructor(basepath: string) {
        this.base = basepath;
    }
    /**
     * getTrancript
     * Get the transcript file to write on a single file
     * @param {string} id
     * @param {string[]} [sections]
     * @returns {Promise<Transcript>}
     * @memberof AsciiDocFileTextIn
     */
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
        let dochtml: string = '';
        try {
            dochtml = this.asciidoctor.convert(doc, { attributes: {showtitle: true, doctype: 'book'}} );
        } catch (err) {
            console.log(err.code);
            throw err;
        }
        const tree = this.htmlparse.parse(dochtml);
        const transcript: Transcript = { segments: [] };
        const end: Array<TextSegment> = [];
        for (const branch of tree) {
            const temp = this.recursive(branch, sections);
            for (const final of temp) {
                end.push(final);
            }
        }
        transcript.segments = end;
        return transcript;
    }
    /**
     * recursive
     * Read the elements on the tree recursively since find a known node
     * @param {*} node
     * @param {string[]} [filter]
     * @returns {Array<TextSegment>}
     * @memberof AsciiDocFileTextIn
     */
    public recursive(node: any, filter?: string[]): Array<TextSegment> {
        const result: Array<TextSegment> = [];
        let out: TextSegment;
        if (node.children) {
            if (node.name === 'h1') {
                out = { kind: 'textelement', element: 'title', text: this.paragraphs(node.children) };
                result.push(out);
            } else if (node.name === 'h2') {
                out = { kind: 'textelement', element: 'h1', text: this.paragraphs(node.children) };
                result.push(out);
            } else if (node.name === 'h3') {
                out = { kind: 'textelement', element: 'h2', text: this.paragraphs(node.children) };
                result.push(out);
            } else if (node.name === 'h4') {
                out = { kind: 'textelement', element: 'h3', text: this.paragraphs(node.children) };
                result.push(out);
            } else if (node.name === 'h5') {
                out = { kind: 'textelement', element: 'h4', text: this.paragraphs(node.children) };
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
                    const inter = this.recursive(node.parent);
                    if (inter && inter.length > 0) {
                        for (const temp of inter) {
                            result.push(temp);
                            }
                    }
                } else {
                    for (const child of node.children) {
                        const inter = this.recursive(child, filter);
                        if (inter && inter.length > 0) {
                            for (const temp of inter) {
                                result.push(temp);
                            }
                        }
                    }
                }
            } else {
                if (node.name === 'p') {
                    out = { kind: 'paragraph', text: this.paragraphs(node.children) };
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
                    this.copyImage(node.attribs.src);
                    result.push(img);
                } else if (node.name === 'table') {
                    out = { kind: 'table', content: this.table(node.children) };
                    result.push(out);
                } else if (node.name === 'ul') {
                    out = { kind: 'list', ordered: false, elements: this.list(node.children) };
                    result.push(out);
                } else if (node.name === 'code') {
                    out = { kind: 'code', content: node.children[0].data };
                    if (node.attribs['data-lang']) {
                        out.language = node.attribs['data-lang'];
                    }
                    result.push(out);
                } else if (node.name === 'br') {
                    const attrs: TextAttributes = { strong: false, cursive: false, underline: false, script: 'normal' };
                    const br: RichString = { text: '\n', attrs };
                    out = { kind: 'paragraph', text: [br] };
                    result.push(out);
                } else if (node.name === 'div' && node.attribs.class === 'content') {
                    out = { kind: 'paragraph', text: this.paragraphs(node.children) };
                    result.push(out);
                    } else {
                        for (const child of node.children) {
                            const inter = this.recursive(child);
                            if (inter && inter.length > 0) {
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
    /**
     * linkContent
     * Create links with the differents parts of the file
     * @param {Array<any>} node
     * @returns {(Paragraph | InlineImage)}
     * @memberof AsciiDocFileTextIn
     */
    public linkContent(node: Array<any>): Paragraph | InlineImage {
        let result: Paragraph | InlineImage;
        if (node.length === 1 && node[0].name === 'img') {
            const img: InlineImage = {
                kind: 'inlineimage',
                img: node[0].attribs.src,
                title: node[0].attribs.alt,
            };
            this.copyImage(node[0].attribs.src);
            result = img;
        } else {
            const out: Paragraph = { kind: 'paragraph', text: this.paragraphs(node) };
            result = out;
        }
        return result;
    }
    /**
     * list
     * If node received is a list, this method get all the elements in there and copy it in the final file.
     * @param {Array<any>} node
     * @returns {(Array<RichText | List | Paragraph | Link | Code>)}
     * @memberof AsciiDocFileTextIn
     */
    public list(node: Array<any>): Array<RichText | List | Paragraph | Link | Code> {
        const result: Array<RichText | List | Paragraph | Link | Code> = [];
        let out: RichText | List | Paragraph | Link | Code;
        for (const li of node) {
            if (li.name === 'li') {
                for (const child of li.children)
                    if (child.type === 'text' && child.data !== '\n') {
                        out = this.paragraphs([child]);
                        result.push(out);
                    } else if (child.name === 'ul') {
                        out = { kind: 'list', ordered: false, elements: this.list(child.children) };
                        result.push(out);
                    } else if (child.name === 'ol') {
                        out = { kind: 'list', ordered: true, elements: this.list(child.children) };
                        result.push(out);
                    } else if (child.name === 'p') {
                        out = { kind: 'paragraph', text: this.paragraphs(child.children) };
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
                    } else if (child.name === 'code') {

                        out = { kind: 'code', content: child.children[0].data };
                        if (child.attribs['data-lang']) {
                            out.language = child.attribs['data-lang'];
                        }
                        result.push(out);
                    } else if (!child.data){
                        out = this.paragraphs(child.children);
                        result.push(out);
                    }
            }
        }
        return result;
    }
    /**
     * table
     * If node received is a table, this method get all the elements in there and copy it in the final file.
     * @param {Array<any>} node
     * @returns {TableBody}
     * @memberof AsciiDocFileTextIn
     */
    public table(node: Array<any>): TableBody {
        let result: TableBody;
        const colspan: Array<Col> = [];
        const colRow: Array<Col> = [];
        const bodyRows: Array<Row> = [];
        for (const child of node) {
            if (child.name === 'tbody' || child.name === 'thead') {
                for (const row of child.children) {
                    if (row.name === 'tr' || child.name === 'tr') {
                        const resultRow: Row = [];
                        for (const cell of row.children) {
                            let element: Cell;
                            let colespan: string = '1';
                            if (cell.name === 'th' || cell.name === 'td') {
                                if (cell.attribs.colspan) {
                                    colespan = cell.attribs.colspan;
                                }
                                if (cell.children && cell.children.length > 0 && cell.children[0].name !== 'br') {
                                    const contentCell = this.tableTd(cell.children);
                                    if (contentCell) {
                                      element = { type: cell.name, colspan: colespan, cell: contentCell };
                                      resultRow.push(element);
                                    }
                                } else {
                                    const p: Paragraph = { kind: 'paragraph', text: this.paragraphs([{ data: ' ', type: 'text' }]) };
                                    element = { type: cell.name, colspan: colespan, cell: [p] };
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
            }
        }
        result = {
            colgroup: colRow,
            body: bodyRows,
        };
        return result;
    }
    /**
     * tableTd
     * If node received is a table, this method get all the elements in there and copy it in the final file.
     * @param {*} node
     * @returns {Array<TableSegment>}
     * @memberof AsciiDocFileTextIn
     */
    public tableTd(node: any): Array<TableSegment>{
        const result: Array<TableSegment> = [];
        for (const child of node) {
            let out: TableSegment;
            if (child.name === 'p') {
              out = { kind: 'paragraph', text: this.paragraphs(child.children) };
              result.push(out);
            } else if (child.name === 'img') {
              const img: InlineImage = { kind: 'inlineimage', img: child.attribs.src, title: child.attribs.alt };
              this.copyImage(child.attribs.src);
              result.push(img);
            } else if (child.name === 'table') {
              out = { kind: 'table', content: this.table(child.children) };
              result.push(out);
            } else if (child.name === 'span') {
              out = { kind: 'paragraph', text: this.paragraphs(child.children) };
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
            } else if (node.name === 'code') {
                out = { kind: 'code', content: node.children[0].data };
                if (node.attribs['data-lang']) {
                    out.language = node.attribs['data-lang'];
                }
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
                    const p: Paragraph = { kind: 'paragraph', text: this.paragraphs([element]) };
                    result.push(p);
                  }
                }
              }
            } else if ((child.type === 'text' && child.data !== '\n') || (child.type === 'tag')) {
              const p: Paragraph = { kind: 'paragraph', text: this.paragraphs([child]) };
              result.push(p);
            }
        }
        return result;
    }
    /**
     * paragraphs
     * If node received is a paragraph, this method get all the elements in there and copy it in the final file.
     * @param {Array<any>} node
     * @returns {RichText}
     * @memberof AsciiDocFileTextIn
     */
    public paragraphs( node: Array<any>): RichText {
        const result: RichText = [];
        for (const child of node) {
            if (child.name === 'img') {
                const img: InlineImage = {
                    kind: 'inlineimage',
                    img: child.attribs.src,
                    title: child.attribs.alt,
                };
                this.copyImage(child.attribs.src);
                result.push(img);
            } else if (child.name === 'a') {
                const out: Link = { kind: 'link', ref: child.attribs.href, text: this.linkContent(child.children) };
                result.push(out);
            } else if (child.name === 'br') {
                const attrs: TextAttributes = { strong: false, cursive: false, underline: false, script: 'normal' };
                const out: RichString = { text: '\n', attrs };
                result.push(out);
            } else if (child.name === 'code') {
                const out: Code = { kind: 'code', content: child.children[0].data };
                if (child.attribs['data-lang']) {
                    out.language = child.attribs['data-lang'];
                }
                result.push(out);
            } else if (child.children) {
                let para: Array<RichString | InlineImage | Link | Table | Code> = this.paragraphs(child.children);
                if (child.name) {
                    const newParam = child;

                    if (child.name === 'span' && child.attribs.class === 'underline') {
                        newParam.name = 'underline';
                    }
                    para = this.putMyAttribute((para as Array<RichString>), newParam.name);
                }
                if (para && para.length > 0) {
                    for (const temp of para) {
                        result.push(temp);
                    }
                }
            } else if (child.type === 'text' && child.data !== '' && child.data !== ' ') {
                     const attrs: TextAttributes = { strong: false, cursive: false, underline: false, script: 'normal' };
                     const out: RichString = { text: child.data, attrs };
                     result.push(out);
            }
        }
        return result;
    }
    /**
     * putMyAttribute
     * Write the different attributes on the paragraph
     * @param {Array<RichString>} para
     * @param {string} myParam
     * @returns {Array<RichString>}
     * @memberof AsciiDocFileTextIn
     */
    public putMyAttribute(para: Array<RichString>, myParam: string): Array<RichString> {
        const paragraph: Array<RichString> = [];
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
    /**
     * copyImage
     * Copy the image in a folder for later, we can use it in the final file
     * @param {string} dir
     * @memberof AsciiDocFileTextIn
     */
    public copyImage(dir: string){
        const arrayDir = dir.split('/');
        let outputDir: string = '';

        if (arrayDir.length > 1) {
            arrayDir.splice(-1, 1);
        }
        for (const piece of arrayDir) {
            outputDir = outputDir + '/' + piece;
        }
        try {
            const shell = require('shelljs');
            shell.mkdir('-p', './imageTemp/' + outputDir);
        } catch (err) {
            if (err.code !== 'EEXIST') {
                throw err;
            }
        }
        try {
            const ncp = require('ncp').ncp;
            ncp(this.base + '/' + dir, 'imageTemp/' + dir,  (err: Error) => {
                if (err) {
                    return console.error(err);
                }
            });
        } catch (err) {
            console.log(err.message);
        }
    }
}