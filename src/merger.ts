import {Merger, DocConfig, TextOut, TextInSources, Index, Transcript} from './types';
//import {Result} from 'result.ts';
//import * as result from 'result.ts';

export class MergerImpl implements Merger {

    public async merge(textinSources: TextInSources, index: Index, textout: TextOut): Promise<void> {

        const transcripts: Array<Transcript> = [];
        for (const node of index[1]){
            if (node.kind === 'asciidoc' || node.kind === 'jira') {
                if (textinSources[node.key]) {
                    textinSources[node.key].getTranscript(node.index).then((data) => {
                        transcripts.push(data); // The bind is by key -> A source identifier. The call to the method is customized for every node.
                    });
                }
                else {
                    // There isn't source-node binding
                    const error_msg = 'Node with id \'' + node.index + '\' doesn\'t have an existing source';
                    throw new Error(error_msg);
                }
            } else {
                const error_msg = '\'' + node.kind + '\'' + ' for \'' + node.index + '\' is an unknown TextInSource';
                throw new Error(error_msg);
            }
        }
        await textout.generate(transcripts);
    }
}