//String enum https://blog.mariusschulz.com/2017/10/27/typescript-2-4-string-enums
export type ScriptType = 'super' | 'sub' | 'normal';

export type ElementType = 'title' | 'h1' | 'h2' | 'h3' | 'h4';

export type TextInSource = 'asciidoc' | 'jira' | 'confluence' | 'url-html';

export interface TextInSources {
  [key: string]: TextIn;
}
export interface TextAttributes {
  strong?: boolean;
  cursive?: boolean;
  underline?: boolean;
  script: ScriptType;
}

export interface RichString {
  attrs: TextAttributes;
  text: string;
}

export type RichText = Array<RichString | InlineImage | Table | Link | Code>;

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
  img: string;
  title: string;
}

export interface Link {
  kind: 'link';
  ref: string;
  text: Paragraph | InlineImage;
}

export interface List {
  kind: 'list';
  ordered: boolean;
  elements: Array<RichText | List | Paragraph | Link | Code>;
}

export interface Code {
  kind: 'code';
  language?: string;
  content: string;
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
// lo mismo type:  https://blog.mariusschulz.com/2016/11/03/typescript-2-0-tagged-union-types
export type TextSegment =
  | TextElement
  | Paragraph
  | InlineImage
  | Table
  | List
  | Link
  | Code;
export type TableSegment = Paragraph | InlineImage | Table | List | Link | Code;

export interface Transcript {
  segments: Array<TextSegment>;
}

export interface Merger {
  merge(
    textinSources: TextInSources,
    index: Index,
    textout: TextOut,
  ): Promise<void>;
}

export interface IndexSource {
  reference: string;
  source_type: TextInSource;
  source: string;
  space?: string | undefined;
  context?: string | undefined;
}

export interface IndexNode {
  reference: string;
  document: string;
  sections?: string[];
}

export type Index = [Array<IndexSource>, Array<IndexNode>];

export interface DocConfig {
  getIndex(): Promise<Index>;
}

export interface TextIn {
  getTranscript(id: string, sections?: string[]): Promise<Transcript>;
  // supportsExport(): boolean;
}

export interface TextOut {
  generate(data: Array<Transcript>): Promise<void>;
}

export interface Cookie {
  name: string;
  value: string;
}

export type Cookies = Array<Cookie>;

export interface ConfluenceService {
  getContentbyCookies(URL: string, cookie: Cookies): Promise<JSON>;
  getContentbyCredentials(URL: string, credentials: Credentials): Promise<JSON>;
  getContent(URL: string, cookie: Cookies | Credentials): Promise<JSON>;
  getImage(URL: string, cookie: Cookies | Credentials): Promise<Buffer>;
}

export interface InputUrlService {
  getContent(URL: string): Promise<string>;
}

export interface Credentials {
  username: string;
  password: string;
}
