import { DocConfig, IndexSource, Index, TextOut, TextIn, Transcript, Paragraph, TextSegment, TextElement, InlineImage, TextInSources, RichString, RichText, TextAttributes, Cookies, ConfluenceService, TableSegment, TableBody, Col, Row, Cell, Credentials, List, Link } from './types';
import * as fs from 'fs';
import { ConfluenceServiceImpl } from './confluenceService';

/*
    The basepath has to have this format: https://adcenter.pl.s2-eu.capgemini.com/confluence/
    
    Where context has to be /confluence/

    API REST: /rest/api/content

    Parameters: 
                &title=My+Title    -> title
                &spaceKey=JQ       -> Workspace
                ?expand=body.view  -> For html content
                &type=page         -> Content type
                ...                -> more info: https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/#content-getContent

    For a page name 'Helloo world':  https://adcenter.pl.s2-eu.capgemini.com/confluence/rest/api/content?title=hello+world&expand=body.view
*/
export class ConfluenceTextIn implements TextIn {

    private url_base: string;
    private space: string | undefined;
    private cookies: Cookies | undefined;
    private credentials: Credentials | undefined;


    private htmlparse = require('html-parse');

    public constructor(basepath: string, space: string | undefined, auth: Cookies | Credentials) {

        this.url_base = basepath;
        this.space = space;
        if ((auth as Cookies)[0]) {
            this.cookies = (auth as Cookies);
        } else if ((auth as Credentials).username) {
            this.credentials = (auth as Credentials);
        }
    }

    public async getTranscript(title: string, sections?: string[]): Promise<Transcript> {

        let transcript: Transcript = { segments: [] };
        let end: Array<TextSegment> = [];
        let confluenceService: ConfluenceService = new ConfluenceServiceImpl();

        const url = this.createURLbyTitle(title); // Optional for console messages
        let error = false;

        // I. Create URI
        const uri = this.createURIbyTitle(title);
        console.log(uri);

        // II. ConfluenceService
        let content;
        if (this.cookies) {
            try {
                content = await confluenceService.getContentbyCookies(uri, this.cookies);
            } catch (err) {
                if (err.message) {
                    throw new Error(err.message);
                } else {
                    throw new Error('It isn\'t possible to get the content from confluence');
                }
            }
        } else if (this.credentials) {
            try {
                content = await confluenceService.getContentbyCredentials(uri, this.credentials);
            } catch (err) {
                if (err.message) {
                    throw new Error(err.message);
                } else {
                    throw new Error('It isn\'t possible to get the content from confluence');
                }
            }
        } else {
            // Logicaly, this never should be shown.
            throw new Error('Credentials are mandatory to access confluence resources');
        }

        if (content) {

            // III. Data processing
            const htmlView = this.processDataFromConfluence(content);

            if (htmlView) {

                // IV. IR
                const tree = this.htmlparse.parse(htmlView);
                for (const branch of tree) {
                    let temp = await this.recursive(branch);
                    for (const final of temp) {
                        end.push(final);
                    }
                }
                transcript.segments = end;
            } else {
                error = true;
            }
        } else {
            error = true;
        }

        if (error) {
            throw new Error('It isn\'t possible to get transcript from ' + url);
        }

        return transcript;
    }

    // Methods related to Confluence
    // -----------------------------

    private processDataFromConfluence(content: JSON): string {

        let htmlContent;
        let error = false;

        const parsed_content = JSON.parse(JSON.stringify(content)); // It's mandatory 
        if (parsed_content.id) { // By Id
            // console.log(' -> Content by id!');
            if (parsed_content.body.view.value) {
                htmlContent = parsed_content.body.view.value;
            } else {
                error = true;
            }
        } else if (parsed_content.results) {
            if (parsed_content.size === 1 && parsed_content.results[0].id) { // By Search (title) & [1 page]  
                // console.log(' -> Content by Title!');
                if (parsed_content.results[0].body.view.value) {
                    htmlContent = parsed_content.results[0].body.view.value;
                } else {
                    error = true;
                }
            } else {
                // At the moment (What should we do with full workspaces? They have several pages. Include all the content? It's easy to iterate over the JSON and get every body.view page values) 
                throw new Error('Only one Confluence page at once is allowed in this version. Check your request.');
            }
        }

        if (error) {
            throw new Error('Received JSON from Confluence is not in a proper format');
        }

        return htmlContent;
    }

    /*
        Confluence API REST

        URL: https://adcenter.pl.s2-eu.capgemini.com/confluence/display/JQ/Jump+the+queue+Home
        URI: https://adcenter.pl.s2-eu.capgemini.com/confluence/rest/api/content?title=Jump+the+queue+Home&expand=body.view

        Example:

        pathName: display/JQ/Jump+the+queue+Home
        pathNameRest: rest/api/content?spaceKey=JQ&title=Jump+the+queue+Home&expand=body.view

    */
    private createURIbyTitle(title: string): string {

        let outputURI = '';

        if (this.url_base && this.space && title) {
            outputURI += this.url_base + `rest/api/content?spaceKey=${this.space}&title=${title}&expand=body.view`;
        } else {
            throw new Error('Bad URI');
        }
        return outputURI;
    }

    private createURLbyTitle(title: string): string {

        let outputURL = '';
        if (this.url_base && this.space && title) {
            outputURL += this.url_base + `display/${this.space}/${title}`;
        } else {
            throw new Error('Bad URL');
        }
        return outputURL;
    }
    
    // IR functionalities
    // ------------------

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

            } else if (node.name === 'a') {
                out = { kind: 'link', ref: node.attribs.href, text: this.linkContent(node.children) };
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

                } else if (node.name === 'img') {
                    let img: InlineImage = {
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
                            if (element.name === 'ol') {
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
                    } else if (!child.data) {
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
            }
        }

        result = {
            colgroup: colRow,
            body: bodyRows,
        };

        return result;
    }

    public tableTd(node: any): Array<TableSegment> {
        let result: Array<TableSegment> = [];
        for (const child of node) {
            let out: TableSegment;
            if (child.name === 'p') {
                out = { kind: 'paragraph', text: this.pharagraphs(child.children) };
                result.push(out);
            } else if (child.name === 'img') {
                let img: InlineImage = {
                    kind: 'inlineimage',
                    img: child.attribs.src,
                    title: child.attribs.alt,
                };
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
                        const temp: Array<TableSegment> = this.tableTd(element.children);
                        for (const inside of temp) {
                            result.push(inside);
                        }
                    }
                }
            }
        }

        return result;
    }

    public pharagraphs(node: Array<any>): RichText {

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

            } else if (child.data !== '\n' && child.data !== '') {
                const attrs: TextAttributes = {
                    strong: false,  // "bold"
                    cursive: false,   // "italic"
                    underline: false,
                    script: 'normal'
                };
                const out: RichString = {
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
