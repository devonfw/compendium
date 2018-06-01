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
import { EmitElement } from '../src/emitFunctions';
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
let transcript: Transcript = { segments: [] };
const segments1: Array<TextSegment> = [];
transcript.segments = segments1;

//paths only test
let pathImage: string = './test-data/input/images/fox.png';
const pathImageSunset: string = './test-data/input/images/sunset.jpg';
const pathConfigFile = './test-data/input/config.json';
const pathAdoc1 = './test-data/input/brownfox2.adoc';
const pathAdoc2 = './test-data/input/manual.adoc';
const outputFolder = 'test-data/output/';
let listFilesOutput: string[] = []; //to erase in after()

/**
 * Files .adoc in the config file that contains many other generic asciidoc features
 * The folder test-data/input/input-data1 (source 2)
 * Testing the pdf Output and Merge
 */
xdescribe('Testing the asciidoc input and the pdf, html, asciidoc Output with good case scenarios', () => {
  before(done => {
    //get the index ready
    docconfig = new ConfigFile(pathConfigFile);
    docconfig
      .getIndex()
      .then(index => {
        index1 = index;
        done();
      })
      .catch(error => {
        done(error);
      });
  });

  //----------CODE---------------------------------------
  describe('Testing Code, code.adoc in input-data1', () => {
    before(done => {
      //get the Transcript IO ready
      transcripts = [];
      textinSources[index1[0][0].reference] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][6].reference]
        .getTranscript(index1[1][6].document)
        .then(transcriptObject => {
          transcripts.push(transcriptObject);
          transcript = transcripts[0];
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Input', done => {
      const telement1 = (transcript.segments[0] as Paragraph).text[1] as Code;
      if (telement1.language) expect(telement1.language).equals('java');
      expect(telement1.content).includes('Scanner');
      done();
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
    before(done => {
      //get the Transcript IO ready
      transcripts = [];
      textinSources[index1[0][0].reference] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][7].reference]
        .getTranscript(index1[1][7].document)
        .then(transcriptObject => {
          transcripts.push(transcriptObject);
          transcript = transcripts[0];
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Input', done => {
      const image = (transcript.segments[0] as Paragraph)
        .text[1] as InlineImage;
      expect(image.kind).equals('inlineimage');
      expect(image.img).equals('images/sunset.jpg');
      done();
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
          //image output
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
    before(done => {
      //get the Transcript IO ready
      transcripts = [];
      textinSources[index1[0][0].reference] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][10].reference]
        .getTranscript(index1[1][10].document)
        .then(transcriptObject => {
          transcripts.push(transcriptObject);
          transcript = transcripts[0];
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Input', done => {
      const listObject1: TextSegment = transcript.segments[0];
      expect(listObject1.kind).equals('list');
      expect((listObject1 as List).ordered).true;
      const list2Level = (listObject1 as List).elements[1] as List;
      const listItem1 = list2Level.elements[1] as Paragraph;
      const codeItem1 = listItem1.text[1] as Code;
      expect(codeItem1.content).includes('gem');
      done();
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
    before(done => {
      //get the Transcript IO ready
      transcripts = [];
      textinSources[index1[0][0].reference] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][8].reference]
        .getTranscript(index1[1][8].document)
        .then(transcriptObject => {
          transcripts.push(transcriptObject);
          transcript = transcripts[0];
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Input', done => {
      const linkObject1 = transcript.segments[0] as Paragraph;
      const linkObject2 = linkObject1.text[0] as Link;
      const linkObject3 = (linkObject2.text as Paragraph).text[0] as RichString;
      expect(linkObject3.text).includes('Open the JSON file');
      done();
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
    before(done => {
      //get the Transcript IO ready
      transcripts = [];
      textinSources[index1[0][0].reference] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][9].reference]
        .getTranscript(index1[1][9].document)
        .then(transcriptObject => {
          transcripts.push(transcriptObject);
          transcript = transcripts[0];
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Input', done => {
      const crossObject1 = (transcript.segments[0] as Paragraph)
        .text[1] as Link;
      expect(crossObject1.ref).equals('#_other_table');
      done();
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
      textinSources[index1[0][1].reference] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][1].reference]
        .getTranscript(index1[1][1].document)
        .then(transcript => {
          transcripts = [];
          transcripts.push(transcript);
          let out: PdfFileTextOut = new PdfFileTextOut(
            outputFolder + 'outBrownfox2',
          );
          out
            .generate(transcripts)
            .then(() => {
              //listFilesOutput.push(outputFolder + 'outBrownfox2.pdf');
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
          reference: 'input-data1',
          source_type: 'asciidoc',
          source: 'test-data/input/input-data1',
        },
        {
          reference: 'input-data2',
          source_type: 'asciidoc',
          source: 'test-data/input/input-data2',
        },
      ];

      const files: IndexNode[] = [
        { reference: 'input-data1', document: 'manual' },
        {
          reference: 'input-data2',
          document: 'brownfox2',
          sections: [''],
        },
      ];

      const index: Index = [sources, files];

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
      shelljs.rm('-rf', outputFolder.concat('images'));
    } catch (error) {
      throw error;
    }
  });
});
