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
  public static baseURL: string;
  public static spaceKey: string | undefined;
  public static credentials: Credentials;

  public static init(
    auth: Cookies | Credentials,
    baseURL: string,
    spaceKey: string | undefined,
  ) {
    this.auth = auth;
    this.baseURL = baseURL;
    this.spaceKey = '';
    this.spaceKey = spaceKey;
    this.arrayImagesSrc = [];
    //Confluence Service
    this.confluenceService = new ConfluenceServiceImpl();
  }

  /**
   * copyImage
   * @param {string} dir
   * @memberof ParseConfluence
   */
  public static async copyImage(dir: string) {
    //the images i want from confluence includes this
    if (dir.includes('download/attachments')) {
      //the dirs which aren´t a link we need to transform them in a link
      if (!dir.includes('http')) {
        dir = dir.replace('/confluence/', '');
        dir = this.baseURL.concat(dir);
      }
      //create folder imageTemp if not exists and project subfolder
      try {
        await extrafs.ensureDir('imageTemp/images/');
        let folder = '';
        if (this.spaceKey !== undefined) {
          folder = `${this.spaceKey}/`;
          await extrafs.ensureDir('imageTemp/images/' + folder);
        }
      } catch (error) {
        console.log(error);
      }
      //src to download image is like the folder but with the filename
      let srcAux = 'imageTemp/images/';
      //extensionKey+filename
      let filename = this.getPath(dir);
      let src = srcAux.concat(filename);
      //get content image if not exists
      let content;
      let error = false;

      if (!(await this.dirExists(src))) {
        try {
          content = await this.confluenceService.getImage(dir, this.auth, src);
        } catch (err) {
          if (err.message) {
            throw new Error(err.message);
          } else {
            throw new Error(
              "It isn't possible to get the image from confluence",
            );
          }
        }
      }
    }
  }
  /** build the path => extension key /  file name with extension
   *
   */
  public static getPath(dir: string): string {
    //extension
    let extension: string = '';
    if (dir.includes('.jpg')) extension = 'jpg';
    if (dir.includes('.png')) extension = 'png';
    if (dir.includes('.jpeg')) extension = 'jpeg';
    if (dir.includes('.gif')) extension = 'gif';
    if (extension === '')
      throw new Error(
        'The image url does not contain an implemented extension',
      );
    //image number with subfolder from project spacekey
    let arrayAux = dir.split('/');
    let filename = arrayAux[arrayAux.length - 2];
    let folder = '';
    if (this.spaceKey !== undefined) {
      folder = `${this.spaceKey}/`;
    }
    //path
    let path = filename.concat('.', extension);
    folder += path;

    return folder;
  }
  /**
   * change the image src when downloading
   *
   * @param {string} dir
   * @memberof ParseLocal overwriting
   */
  public static changeSRC(name: string): string {
    let folder = 'images/';
    let filename = this.getPath(name);
    let src = folder.concat(filename);

    return src;
  }
  /* getting ready for a Confluence api request
  * return the uri given image http path
  */
  private static createUriImage(id: string): string {
    let outputURI = '';

    if (id !== '') {
      outputURI = this.baseURL + `rest/api/content/${id}/child/attachment`;
    } else {
      throw new Error('CreateURI: id cannot be blank');
    }
    return outputURI;
  }
  /*
  * return the id numer of the given image http path
  */
  public static getId(dir: string): string {
    //image number
    let arrayAux = dir.split('/');
    let filename = arrayAux[arrayAux.length - 2];
    filename = '4328086/image2018-1-26_9-36-29.png';
    return filename;
  }
  /* async method
  * return the size of the image given image http path
  * throughout a request to the confluence api
  */
  public static async getImageSize(dir: string): Promise<string> {
    let imageId = this.getId(dir);
    let uri = this.createUriImage(imageId);
    let content = await this.confluenceService.getContent(uri, this.auth);
    const parsed_content = JSON.parse(JSON.stringify(content));
    let filesize = parsed_content.results[0].extensions.fileSize;

    return filesize;
  }

  public static checkImagesList() {
    //we are already validating in get path
  }
}
