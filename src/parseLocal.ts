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
import * as extrafs from 'fs-extra';
import { EmitElement } from './emitFunctions';

export class ParseLocal {
  public base: string;
  public static arrayImagesSrc: string[] = [];
  public constructor(basepath: string) {
    this.base = basepath;
  }

  /**
   *
   * Read the elements on the tree recursively since find a known node
   *
   * @param {*} node
   * @param {string[]} [filter]
   * @returns {Array<TextSegment>}
   * @memberof AsciiDocFileTextIn
   */
  public static recursive(node: any): Array<TextSegment> {
    let result: Array<TextSegment> = [];
    let out: TextSegment;
    if (node.children) {
      if (node.name === 'h1') {
        out = {
          kind: 'textelement',
          element: 'title',
          text: this.paragraphs(node.children),
        };
        result.push(out);
      } else if (node.name === 'h2') {
        out = {
          kind: 'textelement',
          element: 'h1',
          text: this.paragraphs(node.children),
        };
        result.push(out);
      } else if (node.name === 'h3') {
        out = {
          kind: 'textelement',
          element: 'h2',
          text: this.paragraphs(node.children),
        };
        result.push(out);
      } else if (node.name === 'h4') {
        out = {
          kind: 'textelement',
          element: 'h3',
          text: this.paragraphs(node.children),
        };
        result.push(out);
      } else if (node.name === 'h5') {
        out = {
          kind: 'textelement',
          element: 'h4',
          text: this.paragraphs(node.children),
        };
        result.push(out);
      }
      if (node.name === 'p') {
        out = { kind: 'paragraph', text: this.paragraphs(node.children) };
        result.push(out);
      } else if (node.name === 'a') {
        out = {
          kind: 'link',
          ref: node.attribs.href,
          text: this.linkContent(node.children),
        };
        result.push(out);
      } else if (node.name === 'img') {
        this.arrayImagesSrc.push(node.attribs.src);
        const img: InlineImage = {
          kind: 'inlineimage',
          img: this.changeSRC(node.attribs.src),
          title: node.attribs.alt,
        };
        result.push(img);
      } else if (node.name === 'table') {
        out = { kind: 'table', content: this.table(node.children) };
        result.push(out);
      } else if (node.name === 'ul') {
        out = {
          kind: 'list',
          ordered: false,
          elements: this.list(node.children),
        };
        result.push(out);
      } else if (node.name === 'ol') {
        out = {
          kind: 'list',
          ordered: true,
          elements: this.list(node.children),
        };
        result.push(out);
      } else if (node.name === 'code') {
        out = { kind: 'code', content: node.children[0].data };
        if (node.attribs['data-lang']) {
          out.language = node.attribs['data-lang'];
        }
        result.push(out);
      } else if (node.name === 'br') {
        const attrs: TextAttributes = {
          strong: false,
          cursive: false,
          underline: false,
          script: 'normal',
        };
        const br: RichString = { text: '\n', attrs };
        out = { kind: 'paragraph', text: [br] };
        result.push(out);
      } else if (node.name === 'div' && node.attribs.class === 'content') {
        out = { kind: 'paragraph', text: this.paragraphs(node.children) };
        result.push(out);
      } else {
        for (const child of node.children) {
          const inter = this.recursive(child);
          if (inter && inter.length > 0) {
            for (const temp of inter) {
              result.push(temp);
            }
          }
        }
      }
    }

    return result;
  }
  /**
   * linkContent
   * Create links with the differents parts of the file
   * @param {Array<any>} node
   * @returns {(Paragraph | InlineImage)}
   * @memberof AsciiDocFileTextIn
   */
  public static linkContent(node: Array<any>): Paragraph | InlineImage {
    let result: Paragraph | InlineImage;
    if (node.length === 1 && node[0].name === 'img') {
      this.arrayImagesSrc.push(node[0].attribs.src);
      const img: InlineImage = {
        kind: 'inlineimage',
        img: this.changeSRC(node[0].attribs.src),
        title: node[0].attribs.alt,
      };
      result = img;
    } else {
      const out: Paragraph = { kind: 'paragraph', text: this.paragraphs(node) };
      result = out;
    }
    return result;
  }
  /**
   * list
   * If node received is a list, this method get all the elements in there and copy it in the final file.
   * @param {Array<any>} node
   * @returns {(Array<RichText | List | Paragraph | Link | Code>)}
   * @memberof AsciiDocFileTextIn
   */
  public static list(
    node: Array<any>,
  ): Array<RichText | List | Paragraph | Link | Code> {
    const result: Array<RichText | List | Paragraph | Link | Code> = [];
    let out: RichText | List | Paragraph | Link | Code;
    for (const li of node) {
      if (li.name === 'li') {
        for (const child of li.children)
          if (child.type === 'text' && child.data !== '\n') {
            out = this.paragraphs([child]);
            result.push(out);
          } else if (child.name === 'ul') {
            out = {
              kind: 'list',
              ordered: false,
              elements: this.list(child.children),
            };
            result.push(out);
          } else if (child.name === 'ol') {
            out = {
              kind: 'list',
              ordered: true,
              elements: this.list(child.children),
            };
            result.push(out);
          } else if (child.name === 'p') {
            out = { kind: 'paragraph', text: this.paragraphs(child.children) };
            result.push(out);
          } else if (child.name === 'div') {
            for (const element of child.children) {
              if (element.name === 'ol') {
                out = {
                  kind: 'list',
                  ordered: true,
                  elements: this.list(element.children),
                };
                result.push(out);
              } else if (element.name === 'ul') {
                out = {
                  kind: 'list',
                  ordered: false,
                  elements: this.list(element.children),
                };
                result.push(out);
              }
            }
          } else if (child.name === 'a') {
            out = {
              kind: 'link',
              ref: child.attribs.href,
              text: this.linkContent(child.children),
            };
            result.push(out);
          } else if (child.name === 'code') {
            out = { kind: 'code', content: child.children[0].data };
            if (child.attribs['data-lang']) {
              out.language = child.attribs['data-lang'];
            }
            result.push(out);
          } else if (!child.data) {
            out = this.paragraphs(child.children);
            result.push(out);
          }
      }
    }
    return result;
  }
  /**
   * table
   * If node received is a table, this method get all the elements in there and copy it in the final file.
   * @param {Array<any>} node
   * @returns {TableBody}
   * @memberof AsciiDocFileTextIn
   */
  public static table(node: Array<any>): TableBody {
    let result: TableBody;
    const colspan: Array<Col> = [];
    const colRow: Array<Col> = [];
    const bodyRows: Array<Row> = [];
    for (const child of node) {
      if (child.name === 'tbody' || child.name === 'thead') {
        for (const row of child.children) {
          if (row.name === 'tr' || child.name === 'tr') {
            const resultRow: Row = [];
            for (const cell of row.children) {
              let element: Cell;
              let colespan: string = '1';
              if (cell.name === 'th' || cell.name === 'td') {
                if (cell.attribs.colspan) {
                  colespan = cell.attribs.colspan;
                }
                if (
                  cell.children &&
                  cell.children.length > 0 &&
                  cell.children[0].name !== 'br'
                ) {
                  const contentCell = this.tableTd(cell.children);
                  if (contentCell) {
                    element = {
                      type: cell.name,
                      colspan: colespan,
                      cell: contentCell,
                    };
                    resultRow.push(element);
                  }
                } else {
                  const p: Paragraph = {
                    kind: 'paragraph',
                    text: this.paragraphs([{ data: ' ', type: 'text' }]),
                  };
                  element = { type: cell.name, colspan: colespan, cell: [p] };
                  resultRow.push(element);
                }
              }
            }
            bodyRows.push(resultRow);
          }
        }
      } else if (child.name === 'colgroup') {
        for (const col of child.children) {
          let element: Col;
          let colespan: string = '\\"1\\"';
          if (col.name === 'col') {
            if (col.attribs.colespan) {
              colespan = col.attribs.colespan;
            }

            element = { span: colespan, style: col.attribs.style };
            colRow.push(element);
          }
        }
      }
    }
    result = { colgroup: colRow, body: bodyRows };
    return result;
  }
  /**
   * tableTd
   * If node received is a table, this method get all the elements in there and copy it in the final file.
   * @param {*} node
   * @returns {Array<TableSegment>}
   * @memberof AsciiDocFileTextIn
   */
  public static tableTd(node: any): Array<TableSegment> {
    const result: Array<TableSegment> = [];
    for (const child of node) {
      let out: TableSegment;
      if (child.name === 'p') {
        out = { kind: 'paragraph', text: this.paragraphs(child.children) };
        result.push(out);
      } else if (child.name === 'img') {
        this.arrayImagesSrc.push(child.attribs.src);
        const img: InlineImage = {
          kind: 'inlineimage',
          img: this.changeSRC(child.attribs.src),
          title: child.attribs.alt,
        };
        result.push(img);
      } else if (child.name === 'table') {
        out = { kind: 'table', content: this.table(child.children) };
        result.push(out);
      } else if (child.name === 'span') {
        out = { kind: 'paragraph', text: this.paragraphs(child.children) };
        result.push(out);
      } else if (child.name === 'ul') {
        out = {
          kind: 'list',
          ordered: false,
          elements: this.list(child.children),
        };
        result.push(out);
      } else if (child.name === 'ol') {
        out = {
          kind: 'list',
          ordered: true,
          elements: this.list(child.children),
        };
        result.push(out);
      } else if (node.name === 'a') {
        out = {
          kind: 'link',
          ref: node.attribs.href,
          text: this.linkContent(node.children),
        };
        result.push(out);
      } else if (node.name === 'code') {
        out = { kind: 'code', content: node.children[0].data };
        if (node.attribs['data-lang']) {
          out.language = node.attribs['data-lang'];
        }
        result.push(out);
      } else if (child.name === 'div') {
        if (child.children) {
          for (const element of child.children) {
            if (element.children) {
              const temp: Array<TableSegment> = this.tableTd(element.children);
              for (const inside of temp) {
                result.push(inside);
              }
            } else if (element.type === 'text') {
              const p: Paragraph = {
                kind: 'paragraph',
                text: this.paragraphs([element]),
              };
              result.push(p);
            }
          }
        }
      } else if (
        (child.type === 'text' && child.data !== '\n') ||
        child.type === 'tag'
      ) {
        const p: Paragraph = {
          kind: 'paragraph',
          text: this.paragraphs([child]),
        };
        result.push(p);
      }
    }
    return result;
  }
  /**
   * paragraphs
   * If node received is a paragraph, this method get all the elements in there and copy it in the final file.
   * @param {Array<any>} node
   * @returns {RichText}
   * @memberof AsciiDocFileTextIn
   */
  public static paragraphs(node: Array<any>): RichText {
    const result: RichText = [];
    for (const child of node) {
      if (child.name === 'img') {
        this.arrayImagesSrc.push(child.attribs.src);
        const img: InlineImage = {
          kind: 'inlineimage',
          img: this.changeSRC(child.attribs.src),
          title: child.attribs.alt,
        };
        result.push(img);
      } else if (child.name === 'a') {
        const out: Link = {
          kind: 'link',
          ref: child.attribs.href,
          text: this.linkContent(child.children),
        };
        result.push(out);
      } else if (child.name === 'br') {
        const attrs: TextAttributes = {
          strong: false,
          cursive: false,
          underline: false,
          script: 'normal',
        };
        const out: RichString = { text: '\n', attrs };
        result.push(out);
      } else if (child.name === 'code') {
        const out: Code = { kind: 'code', content: child.children[0].data };
        if (child.attribs['data-lang']) {
          out.language = child.attribs['data-lang'];
        }
        result.push(out);
      } else if (child.children) {
        let para: Array<
          RichString | InlineImage | Link | Table | Code
        > = this.paragraphs(child.children);
        if (child.name) {
          const newParam = child;

          if (child.name === 'span' && child.attribs.class === 'underline') {
            newParam.name = 'underline';
          }
          para = this.putMyAttribute(para as Array<RichString>, newParam.name);
        }
        if (para && para.length > 0) {
          for (const temp of para) {
            result.push(temp);
          }
        }
      } else if (
        child.type === 'text' &&
        child.data !== '' &&
        child.data !== ' '
      ) {
        const attrs: TextAttributes = {
          strong: false,
          cursive: false,
          underline: false,
          script: 'normal',
        };
        const out: RichString = { text: child.data, attrs };
        result.push(out);
      }
    }
    return result;
  }
  /**
   * putMyAttribute
   * Write the different attributes on the paragraph
   * @param {Array<RichString>} para
   * @param {string} myParam
   * @returns {Array<RichString>}
   * @memberof AsciiDocFileTextIn
   */
  public static putMyAttribute(
    para: Array<RichString>,
    myParam: string,
  ): Array<RichString> {
    const paragraph: Array<RichString> = [];
    for (const par of para) {
      if (par.attrs) {
        if (myParam === 'strong') {
          par.attrs.strong = true;
        } else if (myParam === 'em') {
          par.attrs.cursive = true;
        } else if (myParam === 'underline') {
          par.attrs.underline = true;
        } else if (myParam === 'sub') {
          par.attrs.script = 'sub';
        } else if (myParam === 'sup') {
          par.attrs.script = 'super';
        }
      }
      paragraph.push(par);
    }

    return paragraph;
  }
  public static base: string;
  /**
   * copyImage
   * Copy the image in a folder for later, we can use it in the final file
   * @param {string} dir
   * @memberof AsciiDocFileTextIn
   */
  public static async copyImage(dir: string) {
    if (!dir.includes('http')) {
      const arrayDir = dir.split('/');
      let outputDir: string = '';

      if (arrayDir.length > 1) {
        arrayDir.splice(-1, 1);
      }
      for (const piece of arrayDir) {
        outputDir = outputDir + '/' + piece;
      }
      //create folder path if not exist
      let exist = false;
      try {
        exist = await this.dirExists('imageTemp/' + outputDir);
      } catch (error) {
        console.log(error);
      }

      if (!exist) {
        try {
          await shelljs.mkdir('-p', './imageTemp/' + outputDir);
        } catch (err) {
          if (err.code !== 'EEXIST') {
            throw err;
          }
        }
      }
      //create image if not exist
      exist = false;
      try {
        exist = await this.dirExists('imageTemp/' + dir);
      } catch (error) {
        console.log(error);
      }
      if (!exist) {
        try {
          let copyPromisify = util.promisify(fs.copyFile);
          await copyPromisify(this.base + '/' + dir, 'imageTemp/' + dir);
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
  /**
   * dirExists
   * Check if the directory exist
   * @protected
   * @param {string} filename
   * @returns
   * @memberof ParseLocal
   */
  protected static async dirExists(filename: string): Promise<boolean> {
    try {
      let accessPromisify = util.promisify(fs.stat);
      let stats = await accessPromisify(filename);

      return true;
    } catch (e) {
      return false;
    }
  }
  /**
   * change the image src when downloading
   *
   * @param {string} dir
   * @memberof ParseLocal
   */
  public static changeSRC(name: string): string {
    if (name.includes('http')) {
      //not implemented yet
      return name;
    } else {
      return name;
    }
  }
  //validate array images
  public static checkImagesList() {
    let result: string[] = this.arrayImagesSrc.filter(item => {
      if (
        item.endsWith('.jpeg') ||
        item.endsWith('.jpg') ||
        item.endsWith('.png') ||
        item.endsWith('.gif')
      ) {
        return item;
      }
    });

    this.arrayImagesSrc = result;
  }
  public static applyFilter(
    allResults: TextSegment[],
    filter: string[],
  ): TextSegment[] {
    let result: TextSegment[] = [];
    filter.forEach(textFilter => {
      let found = false;
      let titleLevel: string = '';
      allResults.forEach(itemIR => {
        if (!found) {
          //filter only titles
          if (itemIR.kind === 'textelement') {
            //filter found
            if ((itemIR.text[0] as RichString).text === textFilter) {
              found = true;
              titleLevel = itemIR.element;
              result = result.concat(itemIR);
            }
          }
        } else {
          //found true include everything until the next title of the same level
          if (
            itemIR.kind === 'textelement' &&
            this.isHigherTitle(itemIR.element, titleLevel)
          ) {
            found = false;
          } else {
            result = result.concat(itemIR);
          }
        }
      });
    });

    return result;
  }
  //comparing two tags titles if is lower true and higher false
  public static isHigherTitle(current: string, reference: string): boolean {
    if (current === 'title') current = 'h0';
    if (reference === 'title') reference = 'h0';
    if (current <= reference) return true;
    else return false;
  }
}
