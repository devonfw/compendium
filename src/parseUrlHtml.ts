import { ParseLocal } from './parseLocal';
import {
  Credentials,
  Cookies,
  ConfluenceService,
  InputUrlService,
} from './types';
import { InputUrlServiceImpl } from './inputUrlService';
import * as fs from 'fs';
import * as util from 'util';
import * as extrafs from 'fs-extra';
import * as shelljs from 'shelljs';
import * as imagemagick from 'imagemagick';

export class ParseUrlHtml extends ParseLocal {
  public static inputUrlService: InputUrlService;
  public static baseURL: string;

  public static init(baseURL: string) {
    this.baseURL = baseURL;
    this.arrayImagesSrc = [];
    //Confluence Service
    this.inputUrlService = new InputUrlServiceImpl();
  }

  /**
   * copyImage
   * @param {string} dir
   * @memberof ParseConfluence
   */
  public static async copyImage(dir: string) {
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
      content = await this.inputUrlService.getContent(this.baseURL + dir);
    } catch (err) {
      if (err.message) {
        throw new Error(err.message);
      } else {
        throw new Error("It isn't possible to get the content from url " + dir);
      }
    }
    //write image in the folder imageTemp
    if (content) {
      let folder = 'imageTemp/images/';
      let filename = this.getPath(dir);
      let src = folder.concat(filename);
      try {
        await extrafs.writeFile(src, content);
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

  /**
   * not change the image src when downloading
   *
   * @param {string} dir
   * @memberof ParseLocal overwriting
   */
  public static changeSRC(name: string): string {
    let filename = this.getPath(name);
    let folder = 'images/' + filename;
    return folder;
  }
  public static getPath(dir: string): string {
    let arrayAux = dir.split('/');
    let filename: string = '';
    if (arrayAux.length > 0) {
      filename = arrayAux[arrayAux.length - 1];
    } else {
      filename = dir;
    }
    return filename;
  }
}
