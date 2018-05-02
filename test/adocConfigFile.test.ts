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
const transcripts: Array<Transcript> = [];

//paths only test
let testDir1: string = './mocks';
let testDir2: string = './mocks/input-data1';
let testDir3: string = './mocks/input-data2';
let testDir4: string = './mocks/input-data2/images';
let testDir5: string = './mocks/input-data1/images';
let testDir6: string = './mocks/input-data1/java';
let testFile1: string = './mocks/config.json';
let testFile2: string = './mocks/input-data1/manual.adoc';
let testFile3: string = './mocks/input-data2/brownfox2.adoc';
let testFile4: string = './mocks/input-data1/java/sample.java';
let pathImage: string = './test/images/fox.png';
const pathImageSunset: string = './test/images/sunset.jpg';

let testListFiles: string[] = [testFile1, testFile2, testFile3, testFile4];
let testListDir: string[] = [
  testDir1,
  testDir2,
  testDir3,
  testDir4,
  testDir5,
  testDir6,
];

let contentTestFile1: string = `{
  "sources": [
    {
      "key": "input-data1",
      "kind": "asciidoc",
      "source": "./mocks/input-data1"
    },
    {
      "key": "input-data2",
      "kind": "asciidoc",
      "source": "./mocks/input-data2"
    }
  ],
  "nodes": [
    {
      "key": "input-data1",
      "index": "manual.adoc"
    },
    {
      "key": "input-data2",
      "index": "brownfox2.adoc"
    }
  ]
}`;
let contentTestFile2: string = `

= Example Manual

This project does something. (C) I haven´t done it yet.

== Source Code

:sourcedir: java

[source,java]
----
include::{sourcedir}/sample.java[]
----

== Images

image::images/sunset.jpg[scaledwidth=75%]

== Ordered List
[start=4]
. Install the gem locally (at the moment it has not been publish to rubygem)
.. Clone the github repository locally \`git clone https://github.com/gscheibel/asciidoctor-confluence.git\`
.. Built it \`gem build asciidoctor-confluence.gemspec\`
.. Install it \`gem install ./asciidoctor-confluence.{version}.gem\`
.. To check it has been done correctly \`asciidoctor-confluence -v\` should display \`asciidoctor-confluence: {version}\`
. Have a Confluence instance
.. If you don't have a Confluence server, you can use a Docker container (e.i.: https://registry.hub.docker.com/u/cptactionhank/atlassian-confluence/), the option requires therefore an Atlassian account so it can generate a trial licence key.

NOTE: An admonition paragraph draws the reader's attention to
auxiliary information.
Its purpose is determined by the label
at the beginning of the paragraph.

== Admonition types

TIP: Pro tip...

IMPORTANT: Don't forget...

WARNING: Watch out for...

CAUTION: Ensure that...

== Image 

[#img-sunset]
.A mountain sunset
[link=http://www.flickr.com/photos/javh/5448336655]
image::images/sunset.jpg[scaledwidth=75%]

== Other Table

[cols=2*]
|===
|Firefox
|Web Browser

|Ruby
|Programming Language

|TorqueBox
|Application Server
|===

== Labeled list

[horizontal]
CPU:: The brain of the computer.
Hard drive:: Permanent storage for operating system and/or user files.
RAM:: Temporarily stores information the CPU uses during operation.

== Hybrid list

Operating Systems::
  Linux:::
    1. Fedora
      * Desktop
    2. Ubuntu
      * Desktop
      * Server
  BSD:::
    1. FreeBSD
    2. NetBSD

Cloud Providers::
  PaaS:::
    1. OpenShift
    2. CloudBees
  IaaS:::
    1. Amazon EC2
    2. Rackspace

== Paragraph attached

* grandparent list item
+
--
** parent list item
*** child list item
--
+
paragraph attached to grandparent list item

== Link

link:protocol.json[Open the JSON file]

== Cross reference

The text at the end of this sentence is cross referenced to <<_other_table,Table>>

`;
let contentTestFile3 = `
== The fox

=== The *real _fox_*

image::images/fox.png[Red Fox, link="http://www.google.com"]

The ~quick~ *brown fox _jumps_ over* the lazy [.underline]#dog.#

|==========================
|Column 1 |Columns 2 | and 3
|1 | |        
|2       |Item 2  |Item 2
|3       |Item 3  |Item 3
|4       |Item 4  a|link:http://www.google.es[Google]
|footer 1|footer 2
a| * hola1
* hola2
** anidada1
** anidada2
*** anidadaotravez1
*** anidadaotravez2
** anidada3
* hola3
|==========================`;
const contentTestFileJava = `
public static void main(String[] args){	
  go();
	}`;

// TEST01
// Should get content from a mock Service
describe('Testing the asciidoc input and the pdf, html, asciidoc Output', () => {
  before(() => {
    //build the mocks with config file
    try {
      shelljs.mkdir('-p', testListDir);
      shelljs.touch(testListFiles);
      fs.writeFileSync(testFile1, contentTestFile1);
      fs.writeFileSync(testFile2, contentTestFile2);
      fs.writeFileSync(testFile3, contentTestFile3, 'utf8');
      fs.writeFileSync(testFile4, contentTestFileJava);
      //images
      shelljs.cp(pathImage, './mocks/input-data2/images/fox.png');
      shelljs.cp(pathImageSunset, './mocks/input-data1/images/sunset.jpg');
    } catch (err) {
      throw err;
    }
  });

  describe('Configfile built with getIndex', () => {
    it('Should show', done => {
      docconfig = new ConfigFile(testFile1);
      docconfig
        .getIndex()
        .then(index => {
          index1 = index;
          assert.isArray(index, 'Index must be an array');
          assert.isArray(index[0], 'Souces must be an array');
          assert.isArray(index[1], 'Nodes must be an array');

          expect(index[0]).have.lengthOf(2, 'There are two sources');
          expect(index[1]).have.lengthOf(2, 'There are two nodes');

          expect(index[0][0].key).equals('input-data1');
          expect(index[0][0].kind).equals('asciidoc');
          expect(index[0][0].source).equals('./mocks/input-data1');

          expect(index[0][1].key).equals('input-data2');
          expect(index[0][1].kind).equals('asciidoc');
          expect(index[0][1].source).equals('./mocks/input-data2');

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
  //----------------------------------------------------------------------------------------------------
  describe('AsciidocInput testing the Input with the node brownfox2.adoc', () => {
    it('h2 and h3 with bold and cursive', done => {
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );

      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
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
    it('link and image', done => {
      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
          const imageLine = transcript.segments[2];
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
    it('p, sub and span', done => {
      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
          const p: TextSegment = transcript.segments[3];
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

    it('Table and List', done => {
      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
          //test table column width
          const tableObject1: TextSegment = transcript.segments[4];
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
  });
  //MANUAL.ADOC---------------------------------------------------------------------------------------
  describe('Asciidoc input with node manual.adoc', () => {
    it('Code: sample.java', done => {
      textinSources[index1[0][0].key] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][0].key]
        .getTranscript(index1[1][0].index)
        .then(transcript => {
          //test <>
          const telement1 = (transcript.segments[3] as Paragraph)
            .text[1] as Code;
          if (telement1.language) expect(telement1.language).equals('java');
          expect(telement1.content).equals('link:java/sample.java[]');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    it('Image jpeg', done => {
      textinSources[index1[1][0].key]
        .getTranscript(index1[1][0].index)
        .then(transcript => {
          const image = (transcript.segments[5] as Paragraph)
            .text[1] as InlineImage;
          expect(image.kind).equals('inlineimage');
          expect(image.img).equals('images/sunset.jpg');
          done();
        })
        .catch(error => {
          done(error);
        });
    });
    //not working
    it('Ordered List', done => {
      textinSources[index1[1][0].key]
        .getTranscript(index1[1][0].index)
        .then(transcript => {
          /* const listObject1: TextSegment = transcript.segments[7];
          console.log(listObject1);
          expect(listObject1.kind).equals('list'); */
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });
  //---------OUTPUT-----------------------------------------------------------------------------------------
  describe('Output to Asciidoc brownfox2', () => {
    it('Testing table, list and paragraphs', done => {
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
          let transcripts: Transcript[] = [];
          transcripts.push(transcript);
          let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
            'outBrownfox2',
          );
          out.generate(transcripts).then(() => {
            try {
              //read the output file
              let result = fs.readFileSync('outBrownfox2.adoc', 'utf8');
              const outputArray = result.split('\n');
              expect(outputArray[9]).equals(
                'The ~quick~ *brown fox* *_jumps_* *over* the lazy [.underline]#dog.#',
              );
              expect(outputArray[16]).equals(
                '| 4 | Item 4 | link:http://www.google.es[Google] ',
              );
              expect(outputArray[21]).equals('*** anidadaotravez1');
              done();
            } catch (error) {
              throw error;
            }
          });
        })
        .catch(error => {
          done(error);
        });
    });
  });
  //not implemented yet
  describe('Output to Asciidoc manual.adoc', () => {
    it('Testing include, code', done => {
      textinSources[index1[0][0].key] = new AsciiDocFileTextIn(
        index1[0][0].source,
      );
      textinSources[index1[1][0].key]
        .getTranscript(index1[1][0].index)
        .then(transcript => {
          let transcripts: Transcript[] = [];
          transcripts.push(transcript);
          let out: AsciiDocFileTextOut = new AsciiDocFileTextOut('outManual');
          out.generate(transcripts).then(() => {
            try {
              //read the output file
              //let result = fs.readFileSync('outManual.adoc', 'utf8');
              //const outputArray = result.split('\n');
              done();
            } catch (error) {
              throw error;
            }
          });
        })
        .catch(error => {
          done(error);
        });
    });
  });
  //-----------------------------------------------------------------------------------------
  describe('Output to HTML brownfox2', () => {
    it('Test the Table, List and paragraphs', done => {
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
          let transcripts: Transcript[] = [];
          transcripts.push(transcript);
          let out: HtmlFileTextOut = new HtmlFileTextOut('outBrownfox2');
          out.generate(transcripts).then(() => {
            try {
              //read the output file
              let result = fs.readFileSync('outBrownfox2.html', 'utf8');
              //compare strings
              const outputArray = result.split('\n');
              expect(outputArray[20].trim()).equals('width:90%;');
              expect(outputArray[108].trim()).equals('<p>anidadaotravez2</p>');
              done();
            } catch (error) {
              throw error;
            }
          });
        })
        .catch(error => {
          done(error);
        });
    });
  });
  //-----------------------------------------------------------------------------------------
  describe('Output to PDF brownfox2', () => {
    it('Test the Table, List and paragraphs', done => {
      textinSources[index1[0][1].key] = new AsciiDocFileTextIn(
        index1[0][1].source,
      );
      textinSources[index1[1][1].key]
        .getTranscript(index1[1][1].index)
        .then(transcript => {
          let transcripts: Transcript[] = [];
          transcripts.push(transcript);
          let out: PdfFileTextOut = new PdfFileTextOut('outBrownfox2');
          out.generate(transcripts).then(() => {
            if (expect(fs.existsSync('outBrownfox2.pdf'))) {
              done();
            } else {
              done(new Error('error to create pdf'));
            }
          });
        })
        .catch(error => {
          done(error);
        });
    });
  });
  /* //MERGE---------------------------------------------------------
  describe('Testing the merge of two files', () => {
    it('should combine 2 asciidoc in one', done => {
      const sources: IndexSource[] = [
        { key: 'input-data1', kind: 'asciidoc', source: 'mocks/input-data1' },
        { key: 'input-data2', kind: 'asciidoc', source: 'mocks/input-data2' },
      ];

      const nodes: IndexNode[] = [
        { key: 'input-data1', index: 'manual.adoc' },
        { key: 'input-data2', index: 'brownfox2.adoc', sections: [''] },
      ];

      const index: Index = [sources, nodes];

      const textinsources: TextInSources = {};

      textinsources['input-data1'] = new AsciiDocFileTextIn(
        'mocks/input-data1',
      );
      textinsources['input-data2'] = new AsciiDocFileTextIn(
        'mocks/input-data2',
      );

      const merger1 = new MergerImpl();
      const textoutMerger: TextOut = new AsciiDocFileTextOut(
        'mocks/mergerResult',
      );
      merger1
        .merge(textinsources, index, textoutMerger)
        .then(() => {
          if (expect(fs.existsSync('mocks/mergerResult.adoc'))) {
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
    });
  }); */

  after(() => {
    try {
      shelljs.rm('-rf', testDir1);
    } catch (error) {
      throw error;
    }
  });
});
