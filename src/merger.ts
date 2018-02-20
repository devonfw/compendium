import {Merger, DocConfig, TextOut, TextInSources, Index, Transcript} from './types';
//import {Result} from 'result.ts';
//import * as result from 'result.ts';

export class MergerImpl implements Merger {

    public async merge(textinSources: TextInSources, index: Index, textout: TextOut): Promise<void> {

        const transcripts: Array<Transcript> = [];
        for (const node of index[1]){
            if (textinSources[node.key]) {
                try{
                    transcripts.push(await textinSources[node.key].getTranscript(node.index)); // The bind is by key -> A source identifier. The call to the method is customized for every node.
                } catch (err) {
                    throw new Error(err.message);
                }
            }
            else {
                // There isn't source-node binding
                const error_msg = 'Node with id \'' + node.index + '\' doesn\'t have an existing source';
                throw new Error(error_msg);
            }

        }
        try {
            await textout.generate(transcripts);
        } catch (err) {
            throw err;
        }
    }
}
