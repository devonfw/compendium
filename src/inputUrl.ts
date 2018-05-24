import {
  DocConfig,
  IndexSource,
  Index,
  TextOut,
  TextIn,
  Transcript,
  Paragraph,
  TextSegment,
  TextElement,
  InlineImage,
  TextInSources,
  RichString,
  RichText,
  TextAttributes,
  InputUrlService,
  Table,
  TableSegment,
  TableBody,
  Col,
  Row,
  Cell,
  Code,
  List,
  Link,
} from './types';
import * as fs from 'fs';
import { InputUrlServiceImpl } from './inputUrlService';
import { ParseUrlHtml } from './parseUrlHtml';
import * as cheerio from 'cheerio';

/*
*    Creates the Transcript object from url content of only one html page
*
*    @param {string} baseUrl 
*               
*/

export class InputUrlTextIn implements TextIn {
  private baseURL: string;
  private inputurlService: InputUrlService;

  private htmlparse = require('html-parse');

  public constructor(baseURL: string) {
    this.baseURL = baseURL;
    this.inputurlService = new InputUrlServiceImpl();
  }
  /**
   * getTrancript
   * Get the transcript file to write on a single file
   * @param {string} title
   * @param {string[]} [sections]
   * @returns {Promise<Transcript>}
   * @memberof InputUrlTextIn
   */
  public async getTranscript(
    title: string,
    sections?: string[],
  ): Promise<Transcript> {
    const transcript: Transcript = { segments: [] };
    const end: Array<TextSegment> = [];

    let url = this.baseURL;

    if (
      this.baseURL === '' ||
      title === '' ||
      this.baseURL === undefined ||
      title === undefined
    ) {
      throw new Error('InputUrlTextIn: BaseURL and title cannot be blank.');
    } else {
      url += title + '.html';
    }

    let content;
    //get json object
    try {
      content = await this.inputurlService.getContent(url);
    } catch (err) {
      if (err.message) {
        throw new Error(err.message);
      } else {
        throw new Error("It isn't possible to get the content from " + url);
      }
    }
    ParseUrlHtml.init(this.baseURL);

    //get the transcript object
    let error = false;
    if (content) {
      let bodyContent = this.getBody(content);
      const tree = this.htmlparse.parse(bodyContent);
      for (const branch of tree) {
        const temp = await ParseUrlHtml.recursive(branch);
        for (const final of temp) {
          end.push(final);
        }
      }
      transcript.segments = end;
      //prepare the images to copy
      ParseUrlHtml.checkImagesList();
      //copy images
      if (ParseUrlHtml.arrayImagesSrc.length > 0) {
        for (const src of ParseUrlHtml.arrayImagesSrc) {
          await ParseUrlHtml.copyImage(src);
        }
      }
    } else {
      error = true;
    }
    if (error) {
      throw new Error("It isn't possible to get transcript from " + url);
    }
    return transcript;
  }
  public supportsExport(): boolean {
    return true;
  }
  /**
   * get Links array, list of documents to read from one index page
   */
  public async getIndexList(title: string): Promise<string[]> {
    let arrayResult: string[] = [];
    let url = this.baseURL;

    if (
      this.baseURL === '' ||
      title === '' ||
      this.baseURL === undefined ||
      title === undefined
    ) {
      throw new Error('getIndexList: BaseURL and title cannot be blank.');
    } else {
      url += title + '.html';
    }
    let content;
    //get text with a request
    try {
      content = await this.inputurlService.getContent(url);
    } catch (err) {
      if (err.message) {
        throw new Error(err.message);
      } else {
        throw new Error("It isn't possible to get the content from " + url);
      }
    }
    //get array of external links
    if (content && content !== '') {
      arrayResult = this.findLinks(content);
    } else {
      throw new Error("It isn't possible to get content from " + url);
    }

    return arrayResult;
  }
  //find all link tags with href containing a .html
  public findLinks(content: any): string[] {
    let arrayResult: string[] = [];
    //we need cheerio library
    const $ = cheerio.load(content);
    //get all links
    let result = $('a').get();
    result.forEach((linkTag: any) => {
      if (linkTag.attribs.href && linkTag.attribs.href.includes('.html')) {
        //I need to remove the .html as per config File requirements
        let linkAux = linkTag.attribs.href.replace('.html', '');
        arrayResult.push(linkAux);
      }
    });

    return arrayResult;
  }
  public getBody(content: string) {
    let body: string = '';
    let start = content.indexOf('<body');
    let end = content.indexOf('</body>') + 7;
    body = content.substring(start, end);

    return body;
  }
}
