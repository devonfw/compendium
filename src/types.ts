
//String enum https://blog.mariusschulz.com/2017/10/27/typescript-2-4-string-enums
export type ScriptType = 'super' | 'sub' | 'normal';

export type ElementType = 'title' | 'h1' | 'h2' | 'h3' | 'h4';

export type TextInSource = 'asciidoc' | 'jira';

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
    text: string;
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

//"Sum type" o "Discriminated Union" o "Tagged Union" todo nombres para
// lomismo type:  https://blog.mariusschulz.com/2016/11/03/typescript-2-0-tagged-union-types
export type TextSegment = TextElement | Paragraph | InlineImage;

export interface Transcript {

    segments: Array<TextSegment>;
}

export interface Merger {

    merge(textinSources: TextInSources, index: Index, textout: TextOut): Promise<void>;

}

export interface IndexSource{

    key: string;
    kind: TextInSource;
    source: string;
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
