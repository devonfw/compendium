import * as chai from 'chai';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import * as util from 'util';
import * as extrafs from 'fs-extra';

import { doCompendium, askInPrompt } from '../src/clinterpreter';
import {
  Transcript,
  TextInSources,
  Index,
  RichString,
  TextElement,
  TextSegment,
  Paragraph,
  InlineImage,
  RichText,
  Link,
  TableSegment,
  Table,
  TableBody,
  Row,
  Cell,
  List,
  Code,
  IndexSource,
  IndexNode,
  TextOut,
} from '../src/types';
import { ConfigFile } from '../src/config';
import { AsciiDocFileTextIn } from '../src/asciidocInput';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import { HtmlFileTextOut } from '../src/html';
import { PdfFileTextOut } from '../src/pdf';
import { MergerImpl } from '../src/merger';
import { resolve } from 'url';

const expect = chai.expect;
const assert = chai.assert;

//VARIABLES------------------------------------------
let docconfig: ConfigFile;
let index1: Index;
const textinSources: TextInSources = {};
let transcripts: Array<Transcript> = [];
let outputResult: string;
let outputArray: string[];

//paths only test
let pathImage: string = './test-data/input/images/fox.png';
const pathImageSunset: string = './test-data/input/images/sunset.jpg';
const pathConfigFile = './test-data/input/config.json';
const pathAdoc1 = './test-data/input/brownfox2.adoc';
const pathAdoc2 = './test-data/input/manual.adoc';
const outputFolder = './test-data/output/';
let listFilesOutput: string[] = []; //to erase in after()

/**
 * 2 asciidoc documents: brownfox2.adoc and manual.adoc
 * This 2 examples contains all the generic asciidoc features
 * Testing Input and Output of the files and the images
 *
 * Mocks are built and unbuilt only for this test, and the source is located in the @param {string} outputFolder
 * Libraries Mocha, util, fs, shelljs, fs-extra and chai
 */
describe('Testing the asciidoc input and the pdf, html, asciidoc Output with good case scenarios', () => {
  before(() => {});
  //-------------------------CONFIG FILE----------------------------------------------------------------------------------
  describe('Testing Config File function', () => {
    it('Should show', done => {
      docconfig = new ConfigFile(pathConfigFile);
      docconfig
        .getIndex()
        .then(index => {
          index1 = index;
          assert.isArray(index, 'Index must be an array');
          assert.isArray(index[0], 'Souces must be an array');
          assert.isArray(index[1], 'Nodes must be an array');

          expect(index[0]).have.lengthOf(2, 'There are two sources');
          expect(index[1]).have.lengthOf(12, 'There are two nodes');

          expect(index[0][0].key).equals('input-data1');
          expect(index[0][0].kind).equals('asciidoc');
          expect(index[0][0].source).equals('./test-data/input/input-data1');

          expect(index[0][1].key).equals('input-data2');
          expect(index[0][1].kind).equals('asciidoc');
          expect(index[0][1].source).equals('./test-data/input/input-data2');

          expect(index[1][0].key).equals('input-data1');
          expect(index[1][0].index).equals('manual.adoc');

          expect(index[1][1].key).equals('input-data2');
          expect(index[1][1].index).equals('brownfox2.adoc');

          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });
  //-------PARAGRAPH 1---------------------------------------------------------------------------------------------
  describe('Testing h2 and h3 with bold and cursive, paragraph1.adoc in input-data2', () => {
    it('Input', done => {
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][2].key]
        .getTranscript(index1[1][2].index)
        .then(transcript => {
          transcripts = [];
          transcripts.push(transcript);
          //test h2
          const h2: TextSegment = transcript.segments[0];
          const h2richString = ((h2 as TextElement).text[0] as RichString).text;
          expect(h2richString).equals('The fox');
          //test h3 with bold and cursive
          const h3: TextSegment = transcript.segments[1];
          const h3richString = ((h3 as TextElement).text[0] as RichString).text;
          expect(h3richString).equals('The ');
          const h3bold = ((h3 as TextElement).text[1] as RichString).text;
          expect(h3bold).equals('real ');
          const h3cursive = ((h3 as TextElement).text[2] as RichString).text;
          expect(h3cursive).equals('fox');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'paragraph1',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'paragraph1.adoc');
          //read the output file
          outputResult = fs.readFileSync(
            outputFolder + 'paragraph1.adoc',
            'utf8',
          );
          outputArray = [];
          outputArray = outputResult.split('\n');
          expect(outputArray[3]).equals('== The fox');
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //-------------IMAGE WITH LINK------------------------------------------------
  describe('Testing link and image, image.adoc in input-data2', () => {
    it('Input', done => {
      transcripts = [];
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][4].key]
        .getTranscript(index1[1][4].index)
        .then(transcript => {
          transcripts.push(transcript);
          const imageLine = transcript.segments[0];
          const link = (imageLine as Paragraph).text[1];
          expect((link as Link).ref).equals('http://www.google.com');
          const image = (link as Link).text as InlineImage;
          expect(image.img).equals('images/fox.png');
          expect(image.title).equals('Red Fox');
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'image',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'image.adoc');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'image.adoc', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          expect(outputArray[3].trim()).equals(
            'image:images/fox.png[Red Fox, link="http://www.google.com"]',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });

    it('Output html', done => {
      let out: HtmlFileTextOut = new HtmlFileTextOut(outputFolder + 'image');
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'image.html');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'image.html', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          //image
          expect(outputArray[30]).equals(
            '<p><span class="image"><a class="image" href="http://www.google.com"><img src="images/fox.png" alt="Red Fox"></a></span></p>',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //-------------------PARAGRAPH2------------------------------------------------
  describe('Testing p, sub and span, paragraph2.adoc in input-data2', () => {
    it('Input', done => {
      transcripts = [];
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][3].key]
        .getTranscript(index1[1][3].index)
        .then(transcript => {
          transcripts.push(transcript);
          const p: TextSegment = transcript.segments[0];
          const prichString = ((p as TextElement).text[0] as RichString).text;
          expect(prichString).equals('The ');
          const psub = ((p as TextElement).text[1] as RichString).text;
          expect(psub).equals('quick');
          const pspan = ((p as TextElement).text[6] as RichString).text;
          expect(pspan).equals('dog.');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'paragraph2',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'paragraph2.adoc');
          //read the output file
          outputResult = fs.readFileSync(
            outputFolder + 'paragraph2.adoc',
            'utf8',
          );
          outputArray = [];
          outputArray = outputResult.split('\n');
          expect(outputArray[3]).equals(
            'The ~quick~ *brown fox* *_jumps_* *over* the lazy [.underline]#dog.#',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
    it('Output html', done => {
      let out: HtmlFileTextOut = new HtmlFileTextOut(
        outputFolder + 'paragraph2',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'paragraph2.html');
          //read the output file
          outputResult = fs.readFileSync(
            outputFolder + 'paragraph2.html',
            'utf8',
          );
          outputArray = [];
          outputArray = outputResult.split('\n');
          expect(outputArray[30]).equals(
            '<p>The <sub>quick</sub> <strong>brown fox</strong> <strong><em>jumps</em></strong> <strong>over</strong> the lazy <span class="underline">dog.</span></p>',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //---------------TABLE WITH LIST AND CODE-----------------------------------------------
  describe('Testing Table and List inside, tableList.adoc in input-data2', () => {
    it('Input', done => {
      transcripts = [];
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][5].key]
        .getTranscript(index1[1][5].index)
        .then(transcript => {
          transcripts.push(transcript);
          //test table column width
          const tableObject1: TextSegment = transcript.segments[0];
          const tableObject2 = ((tableObject1 as TableSegment) as Table)
            .content;
          expect(tableObject2.colgroup[0].style).equals('width: 33.3333%;');
          //test table cell paragraph tex
          const tableRow1 = tableObject2.body[5] as Row;
          const cell1 = (tableRow1[0] as Cell).cell[0] as Paragraph;
          const cell1Text = cell1.text[0] as RichString;
          expect(cell1Text.text).equals('footer 1');
          //test table cell list
          const cellList = (tableRow1[2] as Cell).cell[0] as List;
          const cellListNested1 = cellList.elements[2] as List;
          const cellListNested2 = cellListNested1.elements[2] as List;
          const textCellNested2 = (cellListNested2.elements[1] as Paragraph)
            .text[0];
          expect((textCellNested2 as RichString).text).equals(
            'anidadaotravez2',
          );
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'table',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'table.adoc');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'table.adoc', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          //table
          expect(outputArray[8]).equals(
            '| 4 | Item 4 | link:http://www.google.es[Google] ',
          );
          //list inside table
          expect(outputArray[13]).equals('*** anidadaotravez1');
          done();
        } catch (error) {
          done(error);
        }
      });
    });
    it('Output html', done => {
      let out: HtmlFileTextOut = new HtmlFileTextOut(outputFolder + 'table');
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'table.html');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'table.html', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          //style
          expect(outputArray[20].trim()).equals('width:90%;');
          //list
          expect(outputArray[84].trim()).equals('<p>anidadaotravez2</p>');
          //table
          expect(outputArray[57]).equals(
            '<td class="tableblock halign-left valign-top"><p class="tableblock">4</p></td>',
          );
          //link inside a table cell
          expect(outputArray[59]).equals(
            '<td class="tableblock halign-left valign-top"><p class="tableblock"><a href="http://www.google.es">Google</a></p></td>',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //----------CODE---------------------------------------
  describe('Testing Code, code.adoc in input-data1', () => {
    it('Input', done => {
      transcripts = [];
      textinSources[index1[0][0].key] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][6].key]
        .getTranscript(index1[1][6].index)
        .then(transcript => {
          transcripts.push(transcript);
          const telement1 = (transcript.segments[0] as Paragraph)
            .text[1] as Code;
          if (telement1.language) expect(telement1.language).equals('java');
          expect(telement1.content).includes('Scanner');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'code',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'code.adoc');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'code.adoc', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          expect(outputArray[3]).equals('```java');
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //-----------IMAGE JPG -------------------------------------------------------------------
  describe('Testing Image jpeg, image.adoc in input-data1', () => {
    it('Input', done => {
      transcripts = [];
      textinSources[index1[0][0].key] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][7].key]
        .getTranscript(index1[1][7].index)
        .then(transcript => {
          transcripts.push(transcript);
          const image = (transcript.segments[0] as Paragraph)
            .text[1] as InlineImage;
          expect(image.kind).equals('inlineimage');
          expect(image.img).equals('images/sunset.jpg');
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'imageSunset',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'imageSunset.adoc');
          //read the output file
          outputResult = fs.readFileSync(
            outputFolder + 'imageSunset.adoc',
            'utf8',
          );
          outputArray = [];
          outputArray = outputResult.split('\n');
          expect(outputArray[3]).includes('image:images/sunset.jpg[sunset]');
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //----------OL---------------------------------------------------------------------------------------
  describe('Testing Ordered List 2 levels with link and Code inside, ol.adoc in input-data1', () => {
    it('Input', done => {
      transcripts = [];
      textinSources[index1[0][0].key] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][10].key]
        .getTranscript(index1[1][10].index)
        .then(transcript => {
          transcripts.push(transcript);
          const listObject1: TextSegment = transcript.segments[0];
          expect(listObject1.kind).equals('list');
          expect((listObject1 as List).ordered).true;
          const list2Level = (listObject1 as List).elements[1] as List;
          const listItem1 = list2Level.elements[1] as Paragraph;
          const codeItem1 = listItem1.text[1] as Code;
          expect(codeItem1.content).includes('gem');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'ol',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'ol.adoc');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'ol.adoc', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          //li with code
          expect(outputArray[4]).equals(
            '.. Clone the github repository locally `git clone `',
          );
          //li with link
          expect(outputArray[9]).equals(
            '.. If you don&#8217;t have a Confluence server, you can use a Docker container (e.i.: link:https://registry.hub.docker.com/u/cptactionhank/atlassian-confluence/[https://registry.hub.docker.com/u/cptactionhank/atlassian-confluence/] ), the option requires therefore an Atlassian account so it can generate a trial licence key.',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //----------LINK-------------------------------------------------------------
  describe('Testing Link, link.adoc in input-data1', () => {
    it('Input', done => {
      transcripts = [];
      textinSources[index1[0][0].key] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][8].key]
        .getTranscript(index1[1][8].index)
        .then(transcript => {
          transcripts.push(transcript);
          const linkObject1 = transcript.segments[0] as Paragraph;
          const linkObject2 = linkObject1.text[0] as Link;
          const linkObject3 = (linkObject2.text as Paragraph)
            .text[0] as RichString;
          expect(linkObject3.text).includes('Open the JSON file');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'link',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'link.adoc');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'link.adoc', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          expect(outputArray[3]).equals(
            'link:protocol.json[Open the JSON file]',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });
  //-----------CROSS REFERENCE -----------------------------------------------------------
  describe('Testing Cross reference, cross.adoc in input-data1', () => {
    it('Input', done => {
      transcripts = [];
      textinSources[index1[0][0].key] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][9].key]
        .getTranscript(index1[1][9].index)
        .then(transcript => {
          transcripts.push(transcript);
          const crossObject1 = (transcript.segments[0] as Paragraph)
            .text[1] as Link;
          expect(crossObject1.ref).equals('#_other_table');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Output adoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'cross',
      );
      out.generate(transcripts).then(() => {
        try {
          listFilesOutput.push(outputFolder + 'cross.adoc');
          //read the output file
          outputResult = fs.readFileSync(outputFolder + 'cross.adoc', 'utf8');
          outputArray = [];
          outputArray = outputResult.split('\n');
          expect(outputArray[3]).equals(
            'The text at the end of this sentence is cross referenced to link:#_other_table[Table]',
          );
          done();
        } catch (error) {
          done(error);
        }
      });
    });
  });

  //---------PDF-------------------------------------------------------------------
  describe('Output to PDF brownfox2', () => {
    it('Testing generate pdf function', done => {
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
          transcripts = [];
          transcripts.push(transcript);
          let out: PdfFileTextOut = new PdfFileTextOut(
            outputFolder + 'outBrownfox2',
          );
          out
            .generate(transcripts)
            .then(() => {
              done();
            })
            .catch(error => {
              done(error);
            });
        })
        .catch(error => {
          done(error);
        });
    });
  });
  //MERGE---------------------------------------------------------
  describe('Testing MergerImpl.merge function', () => {
    it('The file is created with the result of the merge', done => {
      const sources: IndexSource[] = [
        {
          key: 'input-data1',
          kind: 'asciidoc',
          source: 'test-data/input/input-data1',
        },
        {
          key: 'input-data2',
          kind: 'asciidoc',
          source: 'test-data/input/input-data2',
        },
      ];

      const nodes: IndexNode[] = [
        { key: 'input-data1', index: 'manual.adoc' },
        { key: 'input-data2', index: 'brownfox2.adoc', sections: [''] },
      ];

      const index: Index = [sources, nodes];

      const textinsources: TextInSources = {};

      textinsources['input-data1'] = new AsciiDocFileTextIn(
        'test-data/input/input-data1',
      );
      textinsources['input-data2'] = new AsciiDocFileTextIn(
        'test-data/input/input-data2',
      );

      const merger1 = new MergerImpl();
      const textoutMerger: TextOut = new AsciiDocFileTextOut(
        outputFolder + 'mergerResult',
      );
      merger1
        .merge(textinsources, index, textoutMerger)
        .then(() => {
          if (expect(fs.existsSync(outputFolder + '/mergerResult.adoc'))) {
            listFilesOutput.push(outputFolder + '/mergerResult.adoc');
            done();
          } else {
            done(new Error("Files haven't been merged"));
          }
        })
        .catch(error => {
          if (error.include('ENOENT')) {
            done();
          } else done(error);
        });
      it('the file created content is correct', done => {
        //read the output file
        outputResult = fs.readFileSync(
          outputFolder + '/mergerResult.adoc',
          'utf8',
        );
        //result file not empty
        expect(outputResult).length.to.not.equal(0);
        outputArray = [];
        outputArray = outputResult.split('\n');
        //the content file includes the first file
        expect(outputArray[4]).includes('= Example Manual');
        //includes the second file
        expect(outputArray[125]).includes('*** anidadaotravez2');
        done();
      });
    });
  });

  after(() => {
    try {
      //delete all output files
      shelljs.rm(listFilesOutput);
    } catch (error) {
      throw error;
    }
  });
});
