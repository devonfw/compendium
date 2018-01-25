import {TextInSource, TextInSources, Index, IndexNode, IndexSource} from './types';
import {TextInMock, TextOutMock} from './mocks/impl';
import * as fs from 'fs';

export let mock = true;

export class ConfigFile {

    public createIndex(configPath: string): Index {
        const config = fs.readFileSync(configPath, 'utf8');
        const data = JSON.parse(config);

        // Sources
        let indexSources: IndexSource[] = [];
        for (const source of data.sources) {
            if (this.checkSourceValuesJSON(source)) {

                const indexSource: IndexSource = {
                    key: source.key,
                    kind: source.kind,
                    source: source.source,
                };
                indexSources.push(indexSource);
            } else {
                throw new Error('JSON: Some sources have not a valid property/value');
            }
        }

        // Nodes
        let indexNodes: IndexNode[] = [];
        for (const node of data.nodes) {
            if (this.checkNodeValuesJSON(node)) {

                const indexNode: IndexNode = {
                    key: node.key,
                    kind: node.kind,
                    index: node.index,
                };
                if (node.sections !== null && node.sections !== '' && node.sections !== undefined) {
                    indexNode.sections = node.sections;
                }
                indexNodes.push(indexNode);
            } else {
                throw new Error('JSON: Some nodes have not a valid property/value');
            }
        }

        // Index
        const index: Index = [indexSources, indexNodes];

        return index;
    }
    private checkSourceValuesJSON(sourceJSON: any): boolean {

        if (sourceJSON.key && sourceJSON.key !== '' && sourceJSON.kind && (sourceJSON.kind === 'asciidoc' || sourceJSON.kind === 'jira')) { // ! Checking kind content isn't scalable
            return true;
        }

        return false;
    }

    private checkNodeValuesJSON(nodeJSON: any): boolean {

        if (nodeJSON.id && nodeJSON.id !== '') {
            return true;
        }

        return false;
    }
}
