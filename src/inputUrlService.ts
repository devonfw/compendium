import { InputUrlService } from './types';
import fetch from 'node-fetch';
import * as util from 'util';

export class InputUrlServiceImpl implements InputUrlService {
  /**
   * getContent
   * get the content from url
   * @param {string} URL
   * @returns {Promise<JSON>}
   * @memberof InputUrlServiceImpl
   */
  public getContent(URL: string): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      fetch(URL)
        .then(res => resolve(res.text()))
        .catch(error => reject(error));
    });
  }
}
