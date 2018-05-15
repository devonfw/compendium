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
import { ParseLocal } from './parseLocal';

/*
*    Creates the Transcript object from url content
*
*    @param {string} baseUrl 
*               
*/

export class InputUrlTextIn implements TextIn {
  private baseURL: string;

  private htmlparse = require('html-parse');

  public constructor(baseURL: string) {
    this.baseURL = baseURL;
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
    let inputurlService: InputUrlService;
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

    inputurlService = new InputUrlServiceImpl();
    let content;
    //get json object
    try {
      content = await inputurlService.getContent(url);
    } catch (err) {
      if (err.message) {
        throw new Error(err.message);
      } else {
        throw new Error("It isn't possible to get the content from " + url);
      }
    }
    console.log(content);
    //get the transcript object
    let error = false;
    if (content) {
      const tree = this.htmlparse.parse(content);
      for (const branch of tree) {
        const temp = await ParseLocal.recursive(branch);
        for (const final of temp) {
          end.push(final);
        }
      }
      transcript.segments = end;
    } else {
      error = true;
    }
    if (error) {
      throw new Error("It isn't possible to get transcript from " + url);
    }
    return transcript;
  }
}
