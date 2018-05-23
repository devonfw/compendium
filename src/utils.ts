import {
  TextInSource,
  TextInSources,
  Index,
  IndexNode,
  IndexSource,
  DocConfig,
} from './types';
import { EmitElement } from './emitFunctions';
import * as fs from 'fs';
import * as shelljs from 'shelljs';

export class Utilities {
  public static outputFile: any;
  public configPath: string;

  public constructor(config: string) {
    this.configPath = config;
  }
  /**
   * checkSourceValuesJSON
   * Check if the values in the JSON are correct, if somethig is wrong show an error
   * @public
   * @param {*} sourceJSON
   * @returns {boolean}
   * @memberof ConfigFile
   */
  public static checkSourceValuesJSON(sourceJSON: any): boolean {
    let valid = true;
    if (
      sourceJSON.reference &&
      sourceJSON.reference !== '' &&
      sourceJSON.source_type &&
      (sourceJSON.source_type === 'asciidoc' ||
        sourceJSON.source_type === 'url-html' ||
        sourceJSON.source_type === 'confluence')
    ) {
      if (sourceJSON.source_type === 'confluence') {
        if (sourceJSON.space && sourceJSON.space !== '' && sourceJSON.context) {
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
   * @public
   * @param {*} nodeJSON
   * @returns {boolean}
   * @memberof ConfigFile
   */
  public static checkNodeValuesJSON(nodeJSON: any): boolean {
    if (
      nodeJSON.reference &&
      nodeJSON.reference !== '' &&
      nodeJSON.document &&
      nodeJSON.document !== ''
    ) {
      return true;
    } else {
      return false;
    }
  }
  /**
   * checkDuplicateReferences
   * Check if configfile has references duplicated, in this case show an error
   * @public
   * @param {IndexSource[]} indexSources
   * @returns {boolean}
   * @memberof ConfigFile
   */
  public static checkDuplicateReferences(indexSources: IndexSource[]): boolean {
    let duplicate = false;
    const source: any = {};
    indexSources.map(item => {
      const ref = item.reference;
      if (ref in source) {
        duplicate = true;
      } else {
        source[ref] = item;
      }
    });
    return duplicate;
  }
  /**
   * checkDocumentsRefConsistency
   * Check if configfile has references in the files that don´t exist in the source, in this case show an error
   * True for wrong reference found
   * @public
   * @param {IndexSource[]} indexSources
   * @returns {boolean}
   * @memberof ConfigFile
   */
  public static checkDocumentsRefConsistency(index: Index): boolean {
    const indexSources: IndexSource[] = index[0] as IndexSource[];
    const indexNodes: IndexNode[] = index[1] as IndexNode[];
    //create array with all the reference from sources
    let sourceRefs: string[] = indexSources.map(item => item.reference);
    let match = true;
    indexNodes.map(item => {
      const ref = item.reference;
      let number = sourceRefs.indexOf(ref);
      if (number < 0) match = false; //this reference don`t has its match in the sources array
    });

    return match;
  }

  /**
   * getSourceTypeByRef
   * create a relation with source_type and reference
   * @public
   * @param {IndexSource[]} indexSources
   * @param {string} reference
   * @returns {string}
   * @memberof ConfigFile
   */
  public static getSourceTypeByRef(
    indexSources: IndexSource[],
    reference: string,
  ): string {
    let source_type = '';
    for (const source of indexSources) {
      if (source.reference === reference) {
        source_type = source.source_type;
      }
    }
    return source_type;
  }
  //Document Nodes
  //when document is an index source must be a unique reference
  //return true if is unique and false if is not
  public static checkNodeDocumentIsUnique(
    reference: string,
    indexNodes: IndexNode[],
  ): boolean {
    //array only references
    let arrayReferences = indexNodes.map(node => node.reference);
    let duplicate = true;
    const source: string[] = [];
    arrayReferences.map(ref => {
      if (source.indexOf(ref) >= 0) {
        duplicate = false;
      } else {
        source.push(ref);
      }
    });

    return duplicate;
  }
  //if document_is_index exists return the position of the document inside the index
  public static findDocumentIsIndex(
    index: IndexNode[],
    sourceRef: string,
  ): number {
    let result: number = -1;
    //find
    index.map((node, index) => {
      if (
        node.reference === sourceRef &&
        node.document_is_index &&
        node.document_is_index === 'true'
      ) {
        result = index;
      }
    });
    return result;
  }
}
