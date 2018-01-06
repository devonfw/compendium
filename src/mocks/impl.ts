//import * as result from 'result.ts';
//import {Result} from 'result.ts';
import { DocConfig, IndexSource, Index, TextOut, TextIn, Transcript, Paragraph } from '../types';

export class DocConfigMock implements DocConfig {

    public async getIndex(): Promise<Index> {

        const index: Index =  [[{kind: 'asciidoc', source: 'c:\\temp'}],
            [{
                kind: 'asciidoc',
                index: 'test-data/brownfox.md',
            }]];
        return index;
    }
}

export class TextOutMock implements TextOut{
    public done: boolean = false;

    public async generate(data: Array<Transcript>): Promise<void> {

        if (data.length < 1){
            throw new Error('No Text instances passed');
        }else {
            console.log(data);
            console.log('generate done');
            this.done = true;
            return;
        }
    }
}

export class TextInMock implements TextIn {
    public constructor(basepath: string){

    }

    public async getTranscript(id: string): Promise<Transcript> {

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
            return transcript;
        } else {
            throw new Error('No Transcript available');
        }
    }
}