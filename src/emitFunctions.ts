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
  Table,
  TableBody,
  Col,
  Row,
  Cell,
  Code,
  TableSegment,
  List,
  Link,
} from './types';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as util from 'util';

export class EmitElement {
  public base: string;
  public constructor(basepath: string) {
    this.base = basepath;
  }

  /**
   * emitCode
   * Parse the parts with code
   * @private
   * @param {Code} myText
   * @returns
   * @memberof AsciiDocFileTextOut
   */
  public static emitCode(myText: Code) {
    const out: Array<string> = [];
    if (myText.language) {
      out.push('```');
      out.push(myText.language);
      out.push('\n');
      out.push(myText.content);
      out.push('\n```');
    } else {
      out.push('`');
      out.push(myText.content);
      out.push('`');
    }
    return out.join('');
  }
  /**
   * emitTextElement
   * Parse the different textElement
   * @private
   * @param {TextElement} myText
   * @returns
   * @memberof AsciiDocFileTextOut
   */
  public static emitTextElement(myText: TextElement) {
    const textelement = myText.element;
    const output: Array<string> = [];
    if (textelement === 'title') {
      output.push('= ');
      output.push(this.emitParagraph(myText));
    }
    if (textelement === 'h1') {
      output.push('== ');
      output.push(this.emitParagraph(myText));
    }
    if (textelement === 'h2') {
      output.push('=== ');
      output.push(this.emitParagraph(myText));
    }
    if (textelement === 'h3') {
      output.push('==== ');
      output.push(this.emitParagraph(myText));
    }
    if (textelement === 'h4') {
      output.push('===== ');
      output.push(this.emitParagraph(myText));
    }
    return output.join('');
  }
  /**
   * emitParagraph
   * Parse the content that you can find in a paragraph
   * @private
   * @param {(Paragraph | TextElement)} myText
   * @returns
   * @memberof AsciiDocFileTextOut
   */
  public static emitParagraph(myText: Paragraph | TextElement) {
    const output: Array<string> = [];
    for (const content of myText.text) {
      if ((content as InlineImage).kind === 'inlineimage') {
        output.push(this.emitImage(content as InlineImage));
      } else if ((content as Link).kind === 'link') {
        output.push(this.emitLink(content as Link));
      } else if ((content as Code).kind === 'code') {
        output.push(this.emitCode(content as Code));
      } else if ((content as Table).kind === 'table') {
        output.push(this.emitTable((content as Table).content));
      } else if ((content as RichString).text) {
        const attrs = (content as RichString).attrs;
        let text = (content as RichString).text;
        let blankFirst = false,
          blankLast = false;
        if (text.charAt(text.length - 1) === ' ') {
          blankLast = true;
        }
        if (text.charAt(0) === ' ') {
          blankFirst = true;
        }
        text = text.trim();
        if (attrs.underline) {
          text = '[.underline]#' + text + '#';
        }
        if (attrs.cursive) {
          text = '_' + text + '_';
        }
        if (attrs.strong) {
          text = '*' + text + '*';
        }
        if (attrs.script === 'normal') {
          text = text;
        } else if (attrs.script === 'sub') {
          text = '~' + text + '~';
        } else if (attrs.script === 'super') {
          text = '^' + text + '^';
        }
        if (blankLast) {
          text = text + ' ';
        }
        if (blankFirst) {
          text = ' ' + text;
        }
        if (output.length === 0) {
          output.push(text);
        } else {
          if (
            output[output.length - 1].charAt(
              output[output.length - 1].length - 1,
            ) !== ' ' &&
            text.charAt(0) !== ' '
          ) {
            output.push(' ');
          }
          output.push(text);
        }
      }
    }
    return output.join('');
  }
  /**
   * emitLink
   * Parse the links or inlineImage
   * @private
   * @param {Link} myLink
   * @returns
   * @memberof AsciiDocFileTextOut
   */
  public static emitLink(myLink: Link) {
    const output: Array<string> = [];
    if ((myLink.text as InlineImage).kind === 'inlineimage') {
      output.push('image:');
      output.push((myLink.text as InlineImage).img);
      output.push('[');
      output.push((myLink.text as InlineImage).title);
      output.push(', link="');
      output.push(myLink.ref);
      output.push('"]');
    } else {
      output.push('link:');
      output.push(myLink.ref);
      output.push('[');
      output.push(this.emitParagraph(myLink.text as Paragraph));
      output.push(']');
    }
    return output.join('');
  }
  /**
   * emitImage
   * To parse the images
   * @private
   * @param {InlineImage} myText
   * @returns
   * @memberof AsciiDocFileTextOut
   */
  public static emitImage(myText: InlineImage) {
    const output: Array<string> = [];

    output.push('image:');
    output.push(myText.img);
    output.push('[');
    output.push(myText.title);
    output.push(']');

    return output.join('');
  }
  /**
   * emitTable
   * To parse the table and the different elements that we can have inside.
   * @private
   * @param {TableBody} content
   * @returns
   * @memberof AsciiDocFileTextOut
   */
  public static emitTable(content: TableBody) {
    const output: Array<any> = [];
    output.push('|==================\n');
    for (const row of content.body) {
      for (const cell of row) {
        if (cell.colspan && cell.colspan !== '1') {
          output.push(cell.colspan);
          output.push('+^');
        }
        for (const inside of cell.cell) {
          if (inside.kind === 'paragraph') {
            output.push('| ');
            output.push(this.emitParagraph(inside));
            output.push(' ');
          } else if (inside.kind === 'inlineimage') {
            output.push('a| ');
            output.push(this.emitImage(inside));
            output.push(' ');
          } else if (inside.kind === 'table') {
            output.push('a| ');
            output.push(this.emitTable(inside.content));
            output.push(' ');
          } else if (inside.kind === 'list') {
            output.push('a| ');
            output.push(this.emitList(inside));
            output.push(' ');
          } else if (inside.kind === 'link') {
            output.push('a| ');
            output.push(this.emitLink(inside));
            output.push(' ');
          } else if (inside.kind === 'code') {
            output.push('a| ');
            output.push(this.emitCode(inside));
            output.push(' ');
          }
        }
      }
      output.push('\n');
    }
    output.push('|==================\n');
    return output.join('');
  }
  /**
   * emitList
   * To parse the list and the different element that we can find on it.
   * @private
   * @param {List} list
   * @param {string} [notation]
   * @returns
   * @memberof AsciiDocFileTextOut
   */
  public static emitList(list: List, notation?: string) {
    const output: Array<string> = [];
    if (!notation) {
      notation = '*';
      if (list.ordered) {
        notation = '.';
      }
    } else {
      if (list.ordered) {
        notation = notation + '.';
      } else {
        notation = notation + '*';
      }
    }
    for (const element of list.elements) {
      if ((element as List).kind === 'list') {
        output.push(this.emitList(element as List, notation));
      } else if ((element as Link).kind === 'link') {
        output.push(this.emitLink(element as Link));
      } else if ((element as Paragraph).kind === 'paragraph') {
        output.push(notation);
        output.push(' ');
        output.push(this.emitParagraph(element as Paragraph));
        output.push('\n');
      } else if ((element as Code).kind === 'code') {
        output.push(this.emitCode(element as Code));
      } else if ((element as RichText)[0]) {
        const temp: Paragraph = {
          kind: 'paragraph',
          text: element as RichText,
        };
        output.push(notation);
        output.push(' ');
        output.push(this.emitParagraph(temp));
        output.push('\n');
      }
    }
    return output.join('');
  }
  /**
   * dirExists
   * Check if the directory exist
   * @private
   * @param {string} filename
   * @returns
   * @memberof AsciiDocFileTextOut
   */
  public static async dirExists(filename: string): Promise<boolean> {
    try {
      let accessPromisify = util.promisify(fs.stat);
      let stats = await accessPromisify(filename);
      return true;
    } catch (e) {
      return false;
    }
  }
}
