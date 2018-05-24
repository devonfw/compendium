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
    if (dir.includes(':')) {
      //not implemented yet
    } else {
      //find out the folder
      let folderAux = this.getFolderPath(dir);
      let folder = 'imageTemp/images/' + folderAux;
      let filename = this.getFilenamePath(dir);
      let src = folder.concat(filename);
      //download image
      let content: any;
      try {
        await extrafs.ensureDir(folder);
        await this.inputUrlService.downloadImage(this.baseURL + dir, src);
      } catch (err) {
        throw new Error(err.message);
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
    let folder = 'images/' + name;
    return folder;
  }
  public static getFolderPath(dir: string): string {
    let aux = dir.lastIndexOf('/') + 1;
    let folder: string = '';
    if (aux > 0) {
      folder = dir.substring(0, aux);
    }
    return folder;
  }
  public static getFilenamePath(dir: string): string {
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
