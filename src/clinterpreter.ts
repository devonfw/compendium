import { COOKIES_TEST, isConfluenceTest } from '../test-data/input/cookieTest';
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
} from './types';
import { AsciiDocFileTextIn } from './asciidocInput';
import { AsciiDocFileTextOut } from './asciidocOutput';
import { HtmlFileTextOut } from './html';
import { PdfFileTextOut } from './pdf';
import { MergerImpl } from './merger';
import { ConfigFile } from './config';
import { ConfluenceTextIn } from './confluence';
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
      if (source.context === 'capgemini') {
        if (isConfluenceTest) {
          textinSources[source.reference] = new ConfluenceTextIn(
            source.source,
            source.space,
            COOKIES_TEST,
          );
        } else {
          throw new Error(
            "Resource under 'Single Sign On' context. This authentication is not yet implemented.",
          );
        }
      } else {
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
          textinSources[source.reference] = new ConfluenceTextIn(
            source.source,
            source.space,
            credentials,
          );
        } catch (err) {
          throw new Error(err.message);
        }
      }
    } else {
      throw new Error('Unknown TextInSource');
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
