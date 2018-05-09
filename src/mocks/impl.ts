//import * as result from 'result.ts';
//import {Result} from 'result.ts';
import { DocConfig, IndexSource, Index, TextOut, TextIn, Transcript, Paragraph, ConfluenceService, Cookies, Credentials } from '../types';
import * as fs from 'fs';

export class DocConfigMock implements DocConfig {

    public async getIndex(): Promise<Index> {

        const index: Index =  [[{key : 'key1', kind: 'asciidoc', source: 'c:\\temp'}],
            [{
                key: 'key1',
                file: 'test-data/brownfox.md',
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

        if (id === 'test-data/brownfox.adoc'){
            const paragraph: Paragraph =  {
                kind: 'paragraph',
                text: [],
            };
            paragraph.text.push({
                attrs: {script: 'normal'},
                text: 'The quick',
            });
            paragraph.text.push({
                attrs: {script: 'normal', strong: true},
                text: 'brown fox',
            });
            paragraph.text.push({
                attrs: {script: 'normal', strong: true, cursive: true},
                text: 'jumps',
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
                    text: [{
                        attrs: { script: 'normal' },
                        text: 'The fox',
                    }],
                },
                paragraph,
            ]};
            return transcript;
        } else {
            throw new Error('No Transcript available');
        }
    }
}
export class ConfluenceServiceImplMock implements ConfluenceService {

    public getContentbyCookies(URL: string, cookies: Cookies): Promise<JSON> {

        throw new Error('Not implemented yet');
    }

    public getContentbyCredentials(URL: string, credentials: Credentials): Promise<JSON> {

        const URI_CAPGEMINI = 'https://adcenter.pl.s2-eu.capgemini.com/confluence/rest/api/content?spaceKey=JQ&title=Jump+the+queue+Home&expand=body.view';
        const URI_LOCAL = 'http://localhost:8090/rest/api/content?spaceKey=CP&title=Jump+the+queue+Home+(Edited+for+Demo)&expand=body.view';

        const goodContent_path = 'test-data/input/confluence/good/JumpTheQueueHome_capgemini.json';
        const multiplesPagesContent_path = 'test-data/input/confluence/bad/multiplePages.json';
        const badFormatContent_path = 'test-data/input/confluence/bad/badFormat.json';

        return new Promise<JSON>((resolve, reject) => {

            const id_multiplePages = 'multiple+pages';
            const id_badFormat = 'bad+format';
            let path = goodContent_path;

            if (URL.indexOf(id_multiplePages) > -1) {
                path = multiplesPagesContent_path;
            } else if (URL.indexOf(id_badFormat) > -1) {
                path = badFormatContent_path;
            }

            try {
                const data = fs.readFileSync(path, 'utf-8');
                resolve(JSON.parse(data));
            } catch (err) {
                reject(err);
            }

        });
    }

}
