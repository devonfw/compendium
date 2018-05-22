import { InputUrlService } from './types';
import * as request from 'request';
import * as util from 'util';

export class InputUrlServiceImpl implements InputUrlService {
  /**
   * getContent
   * get the content from url
   * @param {string} URL
   * @returns {Promise<JSON>}
   * @memberof InputUrlServiceImpl
   */
  public getContent(URL: string): Promise<any> {
    return new Promise<any>((resolve, reject) => {
      request(URL, (error, response, body) => {
        if (error) reject(error);
        if (response && response.statusCode === 200) {
          resolve(body);
        } else {
          reject('error when requesting ' + URL);
        }
      });
    });
  }
}
