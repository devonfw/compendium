import {Merger, DocConfig, TextOut, TextInSources, Index, Transcript} from './types';
//import {Result} from 'result.ts';
//import * as result from 'result.ts';

export class MergerImpl implements Merger {

    public async merge(textinSources: TextInSources, index: Index, textout: TextOut): Promise<void> {

        const transcripts: Array<Transcript> = [];
        for (const node of index[1]){
            if (node.kind === 'asciidoc') {
                // tslint:disable-next-line:no-string-literal
                transcripts.push( await textinSources['asciidoc'].getTranscript(node.index));

            } else {
                throw new Error('Unknown TextInSource');
            }
        }
        await textout.generate(transcripts);
    }
}