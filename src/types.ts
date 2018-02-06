
//String enum https://blog.mariusschulz.com/2017/10/27/typescript-2-4-string-enums
export type ScriptType = 'super' | 'sub' | 'normal';

export type ElementType = 'title' | 'h1' | 'h2' | 'h3' | 'h4';

export type TextInSource = 'asciidoc' | 'jira' | 'confluence';

export interface TextInSources {
    [key: string]: TextIn;
}
export interface TextAttributes {
    strong?: boolean;  // "bold"
    cursive?: boolean;   // "italic"
    underline?: boolean;
    script: ScriptType;
    // more in the future
}

export interface RichString {
    attrs: TextAttributes;
    text: string;
}

export type RichText  = Array<RichString>;

export interface TextElement {
    kind: 'textelement';
    element: ElementType;
    text: RichText;
}

export interface Paragraph {
    kind: 'paragraph';
    text: RichText;
}

export interface InlineImage {
    kind: 'inlineimage';
    img: string; //url
    title: string;
}

export interface Table {
    kind: 'table';
    content: TableBody;
}

export interface TableBody {
    colgroup: Array<Col>;
    body: Array<Row>;
}

export interface Col {
    span?: string;
    style: string;
}
export type Row = Array<Cell>;

export interface Cell {
    type: CellType;
    colspan: string;
    cell: Array<TableSegment>;
}

export type CellType = 'th' | 'td';

//"Sum type" o "Discriminated Union" o "Tagged Union" todo nombres para
// lomismo type:  https://blog.mariusschulz.com/2016/11/03/typescript-2-0-tagged-union-types
export type TextSegment = TextElement | Paragraph | InlineImage | Table;
export type TableSegment = Paragraph | InlineImage | Table;

export interface Transcript {

    segments: Array<TextSegment>;
}

export interface Merger {

    merge(textinSources: TextInSources, index: Index, textout: TextOut): Promise<void>;

}

export interface IndexSource {  // Updated

    key: string;
    kind: TextInSource;
    source: string;
    space?: string | undefined; // For confluence
    context?: string | undefined; // For confluence
}

export interface IndexNode {

    key: string;
    kind: TextInSource;
    index: string;
    sections?: string[];
}

export type Index = [Array<IndexSource>, Array<IndexNode>];

export interface DocConfig {

    getIndex(): Promise<Index>;
}

export interface TextIn {

    getTranscript(id: string, sections?: string[]): Promise<Transcript>;
}

export interface TextOut {

    generate(data: Array<Transcript>): Promise<void>;
}

// New types for confluence implementation

export interface Cookie {
    name: string;
    value: string;
}

export type Cookies = Array<Cookie>;

export interface ConfluenceService {

    getContent(URL: string, cookie: Cookies): Promise<JSON>;
}

