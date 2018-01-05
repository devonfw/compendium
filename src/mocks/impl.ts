import * as result from 'result.ts';
import {Result} from 'result.ts';
import { DocConfig, IndexSource, Index, TextOut, TextIn, Transcript, errorinfo, Paragraph } from '../types';

const empty = undefined;

export class DocConfigMock implements DocConfig {

    public getIndices(): Result<errorinfo, Index> {

        const index: Index =  [[{id: 'asciidoc',
                               source: 'c:\\temp'}],
        [{
            id: 'asciidoc',
            index: 'docs/frontpage.md',
        },
        {
            id: 'asciidoc',
            index: 'docs/secondpage.md',
        }]];

        return result.ok(index);
    }

}

export class TextOutMock implements TextOut{

    public generate(data: Transcript): Result<errorinfo, void> {
        if (data.segments.length < 1){
            return result.error('No Text instances passed');
        }

        console.log(data);
        return result.ok(empty);
    }
}

export class TextInMock implements TextIn {

    public getTranscript(id: string): Result<errorinfo, Transcript> {
        if (id === 'test-data/brownfox.md'){
            //The quick *brown fox _jumps_ over* the lazy dog.
            const paragraph: Paragraph =  {
                kind: 'paragraph',
                text: [],
            };
            paragraph.text.push({
                attrs: {script: 'normal'},
                text: 'The quick ',
            });
            paragraph.text.push({
                attrs: {script: 'normal', strong: true},
                text: 'brown fox ',
            });
            paragraph.text.push({
                attrs: {script: 'normal', strong: true, cursive: true},
                text: 'jumps ',
            });
            paragraph.text.push({
                attrs: {script: 'normal', strong: true},
                text: 'over',
            });
            paragraph.text.push({
                attrs: {script: 'normal'},
                text: 'the lazy dog.',
            });

            const transcript: Transcript = {segments: [
                {
                    kind: 'textelement',
                    element: 'h1',
                    text: 'The fox',
                },
                paragraph,
            ]};
            return result.ok(transcript);
        } else {
            return result.error('no such markdown file exits');
        }
    }
}