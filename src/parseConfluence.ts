import { ParseLocal } from './parseLocal';
import { Credentials, Cookies, ConfluenceService } from './types';
import { ConfluenceServiceImpl } from './confluenceService';
import * as fs from 'fs';
import * as util from 'util';
import * as extrafs from 'fs-extra';
import * as shelljs from 'shelljs';

export class ParseConfluence extends ParseLocal {
  public static auth: Cookies | Credentials;
  public static confluenceService: ConfluenceService;

  public static init(auth: Cookies | Credentials) {
    this.auth = auth;
    //Confluence Service
    this.confluenceService = new ConfluenceServiceImpl();
  }

  /**
   * copyImagenot implemented yet
   * @param {string} dir
   * @memberof ParseConfluence
   */
  public static async copyImage(dir: string) {
    if (dir.includes('http')) {
      //create folder imageTemp if not exists
      try {
        await extrafs.ensureDir('imageTemp/images/');
      } catch (error) {
        console.log(error);
      }
      //get content json
      let content;
      let error = false;
      try {
        content = await this.confluenceService.getImage(dir, this.auth);
      } catch (err) {
        if (err.message) {
          throw new Error(err.message);
        } else {
          throw new Error(
            "It isn't possible to get the content from confluence",
          );
        }
      }
      //write image in the folder imageTemp
      if (content) {
        let folder = 'imageTemp/images/';
        let filename = this.getPath(dir);
        let src = folder.concat(filename);
        try {
          let writePromise = util.promisify(fs.writeFile);
          await writePromise(src, content);
        } catch (err) {
          if (
            err.code !== 'ENOENT' &&
            err.code !== 'ENOTEMPTY' &&
            err.code !== 'EBUSY'
          )
            console.log(err.message);
        }
      }
    }
  }
  /** get the file name and extension
   * @param {string} dir
   * @memberof ParseConfluence
   */
  public static getPath(dir: string): string {
    //extension
    let extension: string = '';
    if (dir.includes('.jpg')) extension = 'jpg';
    if (dir.includes('.png')) extension = 'png';
    if (dir.includes('jpeg')) extension = 'jpeg';
    if (extension === '')
      throw new Error(
        'The image url does not contain an implemented extension',
      );
    //image number
    let arrayAux = dir.split('/');
    let filename = arrayAux[arrayAux.length - 2];
    //path
    let path = filename.concat('.', extension);

    return path;
  }
  /**
   * change the image src when downloading
   *
   * @param {string} dir
   * @memberof ParseLocal overwriting
   */
  public static changeSRC(name: string): string {
    if (name.includes('http')) {
      let folder = 'images/';
      let filename = this.getPath(name);
      let src = folder.concat(filename);
      return src;
    } else {
      return name;
    }
  }
}
