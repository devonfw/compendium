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
  Cookies,
  ConfluenceService,
  Table,
  TableSegment,
  TableBody,
  Col,
  Row,
  Cell,
  Code,
  Credentials,
  List,
  Link,
} from './types';
import * as fs from 'fs';
import { ConfluenceServiceImpl } from './confluenceService';
import { ParseConfluence } from './parseConfluence';

/*
    The basepath has to have this format: https://adcenter.pl.s2-eu.capgemini.com/confluence/

    Where context has to be /confluence/

    API REST: /rest/api/content

    Parameters:
                &title=My+Title    -> title
                &spaceKey=JQ       -> Workspace
                ?expand=body.view  -> For html content
                &type=page         -> Content type
                ...                -> more info: https://docs.atlassian.com/atlassian-confluence/REST/6.6.0/#content-getContent

    For a page name 'Hello world':  https://adcenter.pl.s2-eu.capgemini.com/confluence/rest/api/content?title=hello+world&expand=body.view
    */

export class ConfluenceTextIn implements TextIn {
  private baseURL: string;
  private spaceKey: string | undefined;
  private cookies: Cookies | undefined;
  private credentials: Credentials | undefined;
  private auth: Credentials | Cookies;

  private htmlparse = require('html-parse');

  public constructor(
    baseURL: string,
    spaceKey: string | undefined,
    auth: Cookies | Credentials,
  ) {
    this.baseURL = baseURL;
    this.spaceKey = spaceKey;
    this.auth = auth;
  }
  /**
   * getTrancript
   * Get the transcript file to write on a single file
   * @param {string} title
   * @param {string[]} [sections]
   * @returns {Promise<Transcript>}
   * @memberof ConfluenceTextIn
   */
  public async getTranscript(
    title: string,
    sections?: string[],
  ): Promise<Transcript> {
    const transcript: Transcript = { segments: [] };
    let end: Array<TextSegment> = [];
    let confluenceService: ConfluenceService;

    if (this.baseURL === '') {
      throw new Error('ConfluenceTextIn: BaseURL cannot be blank.');
    } else if (this.spaceKey === undefined) {
      throw new Error('ConfluenceTextIn: SpaceKey is undefined.');
    } else if (this.spaceKey === '') {
      throw new Error('ConfluenceTextIn: SpaceKey cannot be blank.');
    }
    confluenceService = new ConfluenceServiceImpl();
    let uri: string = '';
    let url: string = '';
    try {
      uri = this.createURIbyTitle(title);
      url = this.createURLbyTitle(title);
    } catch (err) {
      throw new Error(err.message);
    }

    //get content json
    let content;
    let error = false;
    try {
      content = await confluenceService.getContent(uri, this.auth);
    } catch (err) {
      if (err.message) {
        throw new Error(err.message);
      } else {
        throw new Error("It isn't possible to get the content from confluence");
      }
    }

    //from json to transcript
    //parseConfluence needs authoritation to download images
    ParseConfluence.init(this.auth, this.baseURL, this.spaceKey);
    try {
      if (content) {
        const htmlView = this.processDataFromConfluence(content);
        if (htmlView) {
          const tree = this.htmlparse.parse(htmlView);

          for (const branch of tree) {
            const temp = await ParseConfluence.recursive(branch);
            for (const final of temp) {
              end.push(final);
            }
          }
          //apply the filter
          if (sections !== undefined) {
            end = ParseConfluence.applyFilter(end, sections);
          }
          //add title of the concluence page
          end.unshift(this.addTitlePage(title));
          //save the final result
          transcript.segments = end;
        } else {
          error = true;
        }
      } else {
        error = true;
      }
    } catch (error) {
      throw error;
    }

    if (error) {
      throw new Error("It isn't possible to get transcript from " + url);
    }
    //copy images at the end
    if (ParseConfluence.arrayImagesSrc.length > 0) {
      for (const src of ParseConfluence.arrayImagesSrc) {
        await ParseConfluence.copyImage(src);
      }
    }
    return transcript;
  }
  /**
   * processDataFromConfluence
   * Read the JSON content from Confluence to parse it
   * @private
   * @param {JSON} content
   * @returns {string}
   */
  private processDataFromConfluence(content: JSON): string {
    let htmlContent;
    let error = false;
    const parsed_content = JSON.parse(JSON.stringify(content));
    if (parsed_content.id) {
      if (parsed_content.body.view.value) {
        htmlContent = parsed_content.body.view.value;
      } else {
        error = true;
      }
    } else if (parsed_content.results) {
      if (parsed_content.size === 1 && parsed_content.results[0].id) {
        //get body view value
        if (parsed_content.results[0].body.view.value) {
          htmlContent = parsed_content.results[0].body.view.value;
        } else {
          error = true;
        }
      } else if (parsed_content.size === 0) {
        throw new Error('Confluence page request is empty');
      } else {
        throw new Error(
          'Only one Confluence page is allowed at once in this version. Check your request please.',
        );
      }
    }
    if (error) {
      throw new Error(
        'Received JSON from Confluence is not in a proper format.',
      );
    }
    return htmlContent;
  }

  /*
        Confluence API REST

        URL: https://adcenter.pl.s2-eu.capgemini.com/confluence/display/JQ/Jump+the+queue+Home
        URI: https://adcenter.pl.s2-eu.capgemini.com/confluence/rest/api/content?title=Jump+the+queue+Home&expand=body.view

        Example:

        pathName: display/JQ/Jump+the+queue+Home
        pathNameRest: rest/api/content?spaceKey=JQ&title=Jump+the+queue+Home&expand=body.view

    */
  /**
   * createURIbyTitle
   * Create the URI to get de JSON since the known title
   * @private
   * @param {string} title
   * @returns {string}
   */
  private createURIbyTitle(title: string): string {
    let outputURI = '';

    if (title !== '') {
      outputURI +=
        this.baseURL +
        `rest/api/content?spaceKey=${
          this.spaceKey
        }&title=${title}&expand=body.view`;
    } else {
      throw new Error('CreateURI: Title cannot be blank');
    }
    return outputURI;
  }
  /**
   * createURLbyTitle
   * Create the URL to get the JSON by confluence title
   * @private
   * @param {string} title
   * @returns {string}
   */
  private createURLbyTitle(title: string): string {
    let outputURL = '';
    if (title !== '') {
      outputURL += this.baseURL + `display/${this.spaceKey}/${title}`;
    } else {
      throw new Error('CreateURL: Title cannot be blank');
    }
    return outputURL;
  }

  //not implemented yet
  public supportsExport(): boolean {
    return false;
  }
  //to find and list all the links of this title
  //return a string array with all the links
  public async getIndexList(title: string): Promise<string[]> {
    let arrayResult: string[] = [];
    return arrayResult;
  }
  //add title of the page in confluence otherwise it is messy
  public addTitlePage(title: string): TextElement {
    let titleAux1 = title.split('+');
    let titleAux2 = titleAux1.join(' ');
    let richStringAux: RichString = {
      attrs: { strong: true, script: 'normal' },
      text: titleAux2,
    };
    let richTextAux: RichText = [richStringAux];
    let titleObject1: TextElement = {
      kind: 'textelement',
      element: 'title',
      text: richTextAux,
    };
    return titleObject1;
  }
}
