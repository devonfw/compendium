import { TextInSource, TextInSources, Index, IndexNode, IndexSource, DocConfig } from './types';
import * as fs from 'fs';

export class ConfigFile implements DocConfig {

    public configPath: string;

    public constructor(config: string) {
        this.configPath = config;
    }

    public async getIndex(): Promise<Index> {
        const config = fs.readFileSync(this.configPath, 'utf8');
        const data = JSON.parse(config);

        // Sources
        let indexSources: IndexSource[] = [];
        for (const source of data.sources) {
            if (this.checkSourceValuesJSON(source)) {

                let indexSource: IndexSource = {
                    key: source.key,
                    kind: source.kind,
                    source: source.source,
                };
                if (source.kind === 'confluence') {
                    indexSource.space = source.space;
                    indexSource.context = source.context;
                }
                indexSources.push(indexSource);
            } else {
                throw new Error('JSON: Some sources don\'t have a valid property/value');
            }
        }

        // Nodes
        let indexNodes: IndexNode[] = [];
        for (const node of data.nodes) {
            if (this.checkNodeValuesJSON(node)) {

                const indexNode: IndexNode = {
                    key: node.key,
                    index: node.index,
                };
                if (node.sections !== null && node.sections !== '' && node.sections !== undefined) {
                    if (node.sections.isArray()) {
                        indexNode.sections = node.sections;
                    } else {
                        console.log('The array of sections in ' + node.index + ' is malformed. All document will be loaded.\n');
                    }
                }
                indexNodes.push(indexNode);
            } else {
                throw new Error('JSON: Some nodes don\'t have a valid property/value');
            }
        }

        // Index
        const index: Index = [indexSources, indexNodes];

        return index;
    }
    private checkSourceValuesJSON(sourceJSON: any): boolean { // TODO: Refactor

        let valid = true;

        // I. Common values
        if (sourceJSON.key && sourceJSON.key !== '' && sourceJSON.kind && (sourceJSON.kind === 'asciidoc' || sourceJSON.kind === 'confluence')) { // ! Checking kind content isn't scalable         

            // II. Confluence values
            if (sourceJSON.kind === 'confluence') {
                if (sourceJSON.space && sourceJSON.space !== '' && sourceJSON.context) { // TODO: Specify possible context values Ie: ( 'sso' || 'basic' || ...) && (sourceJSON.context === 'sso' || sourceJSON.context === 'basic')
                    valid = true;
                    //return true;
                } else {
                    valid = false;
                }
            }

        } else {
            valid = false;
        }

        return valid;
    }

    private checkNodeValuesJSON(nodeJSON: any): boolean {

        let valid = true;

        // I. Common values
        if (nodeJSON.index && nodeJSON.index !== '') {

            // II. Confluence values
            if (nodeJSON.kind && nodeJSON.kind === 'confluence' && nodeJSON.index.indexOf(' ') !== -1) { // Blancspaces are forbiden
                valid = false;
            }

        } else {
            valid = false;
        }

        return valid;
    }
}
