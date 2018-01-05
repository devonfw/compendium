
import {Result} from 'result.ts';

export type errorinfo = string;

//String enum https://blog.mariusschulz.com/2017/10/27/typescript-2-4-string-enums
export type ScriptType = 'super' | 'sub' | 'normal';

export type ElementType = 'title' | 'h1' | 'h2' | 'h3' | 'h4';

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

type RichText  = Array<RichString>;

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

    merge(cfg: DocConfig, out: TextOut): Result<errorinfo, void>;

}

export interface IndexSource{

    id: string;
    source: string;
}

export interface IndexNode {

    id: string;
    index: string;
}

export type Index = [Array<IndexSource>, Array<IndexNode>];

export interface DocConfig {

    getIndices(): Result<errorinfo, Index>;  // puede ser un Iterator tambien
}

export interface TextIn {

    getTranscript(id: string): Result<errorinfo, Transcript>;
}

export interface TextOut {

    generate(data: Transcript): Result<errorinfo, void>;
}
