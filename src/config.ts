import {
  TextInSource,
  TextInSources,
  Index,
  IndexNode,
  IndexSource,
  DocConfig,
} from './types';
import { Utilities } from './utils';
import * as fs from 'fs';
import * as util from 'util';

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
    const readFile = util.promisify(fs.readFile);
    const config = await readFile(this.configPath, 'utf8');
    const data = JSON.parse(config);
    const indexSources: IndexSource[] = [];
    if (data.sources) {
      for (const source of data.sources) {
        if (Utilities.checkSourceValuesJSON(source)) {
          const indexSource: IndexSource = {
            reference: source.reference,
            source_type: source.source_type,
            source: source.source,
          };
          if (source.source_type === 'confluence') {
            indexSource.space = source.space;
            indexSource.context = source.context;
          }
          indexSources.push(indexSource);
        } else {
          throw new Error(
            "JSON: Some sources don't have a valid property/value",
          );
        }
      }
    } else throw new Error('JSON: Some sources have the wrong property');
    if (Utilities.checkDuplicateReferences(indexSources)) {
      throw new Error(
        'JSON: Data inconsistency, some sources have the same reference.',
      );
    }

    const indexNodes: IndexNode[] = [];
    for (const node of data.documents) {
      if (Utilities.checkNodeValuesJSON(node)) {
        const indexNode: IndexNode = {
          reference: node.reference,
          document: node.document,
        };
        if (
          node.sections !== null &&
          node.sections !== '' &&
          node.sections !== undefined
        ) {
          if (node.sections.isArray()) {
            indexNode.sections = node.sections;
          } else {
            console.log(
              'The array of sections in ' +
                node.document +
                ' is malformed. All document will be loaded.\n',
            );
          }
        }
        indexNodes.push(indexNode);
      } else {
        throw new Error(
          "JSON: Some documents don't have a valid property/value",
        );
      }
    }
    const index: Index = [indexSources, indexNodes];
    if (!Utilities.checkDocumentsRefConsistency(index)) {
      throw new Error(
        'JSON: Data inconsistency, some documents references are not matching with the sources.',
      );
    }
    return index;
  }
}
