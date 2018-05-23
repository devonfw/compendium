import { COOKIES_TEST, isConfluenceTest } from '../test-data/input/cookieTest';
import { ConfluenceServiceImpl } from './confluenceService';
import * as fs from 'fs';
import {
  IndexSource,
  IndexNode,
  Index,
  TextInSources,
  Transcript,
  TextOut,
  Merger,
  DocConfig,
  Cookie,
  Cookies,
  Credentials,
  ConfluenceService,
} from './types';
import { AsciiDocFileTextIn } from './asciidocInput';
import { AsciiDocFileTextOut } from './asciidocOutput';
import { HtmlFileTextOut } from './html';
import { PdfFileTextOut } from './pdf';
import { MergerImpl } from './merger';
import { ConfigFile } from './config';
import { ConfluenceTextIn } from './confluenceInput';
import { InputUrlTextIn } from './inputUrl';
import { Utilities } from './utils';
import chalk from 'chalk';
import * as shelljs from 'shelljs';
import * as util from 'util';

/**
 * doCompendium
 * Read the information introduced in the CLI to interpreted it and create the final file
 * @export
 * @param {string} configFile
 * @param {string} format
 * @param {(string | undefined)} outputFile
 */
export async function doCompendium(
  configFile: string,
  format: string,
  outputFile: string | undefined,
) {
  let docconfig: ConfigFile;
  let fileOutput: TextOut;
  let merger: Merger;
  let index;

  docconfig = new ConfigFile(configFile);
  try {
    index = await docconfig.getIndex();
  } catch (err) {
    throw new Error(err.message);
  }

  let output = 'result';
  if (outputFile) {
    output = outputFile;
  }

  if (format === 'asciidoc') {
    fileOutput = new AsciiDocFileTextOut(output);
  } else if (format === 'html') {
    fileOutput = new HtmlFileTextOut(output);
  } else if (format === 'pdf') {
    fileOutput = new PdfFileTextOut(output);
  } else {
    const msg = "Format '" + format + "' is not implemented";
    throw new Error(msg);
  }

  const textinSources: TextInSources = {};
  for (const source of index[0]) {
    if (source.source_type === 'asciidoc') {
      textinSources[source.reference] = new AsciiDocFileTextIn(source.source);
    } else if (source.source_type === 'confluence') {
      //need credentials first
      let credentials: Credentials;
      try {
        console.log(
          chalk.bold(
            `Please enter credentials for source with key '${chalk.green.italic(
              source.reference,
            )}' (${chalk.blue(source.source)})\n`,
          ),
        );
        credentials = await askInPrompt();
      } catch (err) {
        throw new Error(err.message);
      }
      if (source.context === 'capgemini') {
        //capgemini is from the internal network
        if (isConfluenceTest) {
          textinSources[source.reference] = new ConfluenceTextIn(
            source.source,
            source.space,
            COOKIES_TEST,
          );
        } else {
          //need session cookie
          let cookies: Cookies = [];
          let confluenceService: ConfluenceService;
          confluenceService = new ConfluenceServiceImpl();
          let uri = source.source;
          try {
            cookies = await confluenceService.getSessionCookiesByCredentials(
              uri,
              credentials,
            );
          } catch (error) {
            throw new Error(error.message);
          }
          //proccess with the confluence Text in proccess
          textinSources[source.reference] = new ConfluenceTextIn(
            source.source,
            source.space,
            cookies,
          );
        }
      } else {
        try {
          textinSources[source.reference] = new ConfluenceTextIn(
            source.source,
            source.space,
            credentials,
          );
        } catch (err) {
          throw new Error(err.message);
        }
      }
    } else if (source.source_type === 'url-html') {
      textinSources[source.reference] = new InputUrlTextIn(source.source);
    } else {
      throw new Error('Unknown TextInSource');
    }
    //Check if the source has a document_is_index true
    //if not exists position -1, if exists position of its array
    let documentIsIndexPosition: number = Utilities.findDocumentIsIndex(
      index[1],
      source.reference,
    );
    if (documentIsIndexPosition >= 0) {
      //Index exists but check if source type supports it
      if (textinSources[source.reference].supportsExport()) {
        let arrayTitles = await textinSources[source.reference].getIndexList(
          index[1][documentIsIndexPosition].document,
        );
        if (arrayTitles.length > 0) {
          index[1];
          //save the list inside the index
          for (let title of arrayTitles) {
            index[1].push({
              reference: source.reference,
              document: title,
            });
          }
        } else {
          console.log('No links meeting requirements inside the index page');
        }
      } else {
        throw new Error(
          'Source type: ' +
            source.source_type +
            ' not supports export all documents from index. ',
        );
      }
    }
  }

  if (output.split('/').length > 1) {
    const myOutput = output.replace(output.split('/').splice(-1, 1)[0], '');
    try {
      shelljs.mkdir('-p', myOutput);
    } catch (err) {
      if (err.code !== 'EEXIST') {
        throw err;
      }
    }
  }

  merger = new MergerImpl();
  try {
    await merger.merge(textinSources, index, fileOutput);
  } catch (e) {
    console.error(e.message);
  }

  console.log('\n Process finished!');
}
/**
 * askInPrompt
 * Ask for the username and password if you introduce an input file that needs credentials to read it
 * @export
 * @returns {Promise<Credentials>}
 */
export async function askInPrompt(): Promise<Credentials> {
  const prompt = require('prompt');
  let credentials: Credentials;

  const promise = new Promise<Credentials>((resolve, reject) => {
    prompt.start();

    prompt.get(
      [
        {
          name: 'username',
          required: true,
        },
        {
          name: 'password',
          hidden: true,
          replace: '*',
          required: true,
        },
      ],
      (err: any, result: any) => {
        credentials = {
          username: result.username,
          password: result.password,
        };
        if (credentials) {
          resolve(credentials);
        } else {
          reject(err.message);
        }
      },
    );
  });

  return promise;
}
/**
 * dirExists
 * Check if the directory introduce exist
 * @param {string} filename
 * @returns
 */
async function dirExists(filename: string) {
  try {
    let accessPromisify = util.promisify(fs.access);
    await accessPromisify(filename);
    return true;
  } catch (e) {
    return false;
  }
}
