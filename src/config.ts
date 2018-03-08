import { TextInSource, TextInSources, Index, IndexNode, IndexSource, DocConfig } from './types';
import { TextInMock, TextOutMock } from './mocks/impl';
import * as fs from 'fs';

export let mock = false;

export class ConfigFile implements DocConfig {

    public configPath: string;

    public constructor(config: string) {
        this.configPath = config;
    }
    /**
     * getIndex
     * Get the index in the config.json file
     * @returns {Promise<Index>}
     * @memberof ConfigFile
     */
    public async getIndex(): Promise<Index> {
            const config = fs.readFileSync(this.configPath, 'utf8');
            const data = JSON.parse(config);

            // Sources
            const indexSources: IndexSource[] = [];
            for (const source of data.sources) {
                if (this.checkSourceValuesJSON(source)) {

                    const indexSource: IndexSource = {
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

            // Consistency I. Duplicate keys
            if (this.checkDuplicateKeys(indexSources)) {
                throw new Error('JSON: Data inconsistency, some sources have the same key.');
            }

            // Nodes
            const indexNodes: IndexNode[] = [];
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
    /**
     * checkSourceValuesJSON
     * Check if the values in the JSON are correct, if somethig is wrong show an error
     * @private
     * @param {*} sourceJSON
     * @returns {boolean}
     * @memberof ConfigFile
     */
    private checkSourceValuesJSON(sourceJSON: any): boolean { // TODO: Refactor

        let valid = true;

        if (sourceJSON.key && sourceJSON.key !== '' && sourceJSON.kind && (sourceJSON.kind === 'asciidoc' || sourceJSON.kind === 'confluence')) {

            if (sourceJSON.kind === 'confluence') {
                if (sourceJSON.space && sourceJSON.space !== '' && sourceJSON.context) { // TODO: Specify possible context values Ie: ( 'sso' || 'basic' || ...) && (sourceJSON.context === 'sso' || sourceJSON.context === 'basic')
                    valid = true;
                } else {
                    valid = false;
                }
            }

        } else {
            valid = false;
        }

        return valid;
    }
    /**
     * checkNodeValuesJSON
     * check if the information on the nodes is correct
     * @private
     * @param {*} nodeJSON
     * @returns {boolean}
     * @memberof ConfigFile
     */
    private checkNodeValuesJSON(nodeJSON: any): boolean {

            if (nodeJSON.key && nodeJSON.key !== '' && nodeJSON.index && nodeJSON.index !== '') {
                return true;
            } else {
                return false;
            }
        }
    /**
     * checkDuplicateKeys
     * Check if configfile has keys duplicated, in this case show an error
     * @private
     * @param {IndexSource[]} indexSources
     * @returns {boolean}
     * @memberof ConfigFile
     */
    private checkDuplicateKeys(indexSources: IndexSource[]): boolean {

            let duplicate = false;
            const source: any = {};

            indexSources.map((item) => {
                const key = item.key;
                if (key in source) {
                    duplicate = true;
                }
                else {
                    source[key] = item;
                }

            });
            return duplicate;
    }
    /**
     * getKindByKey
     * create a relation with kind and key
     * @private
     * @param {IndexSource[]} indexSources
     * @param {string} key
     * @returns {string}
     * @memberof ConfigFile
     */
    private getKindByKey(indexSources: IndexSource[], key: string): string {

            let kind = '';

            for (const source of indexSources) {
                if (source.key === key) {
                    kind = source.kind;
                }
            }

            return kind;
    }
    }
