import {
  TextIn,
  Credentials,
  TextOut,
  RichText,
  RichString,
  Cookies,
  Transcript,
  TextSegment,
  Link,
  Paragraph,
  InlineImage,
  List,
} from '../src/types';
import { ConfluenceTextIn } from '../src/confluence';
import { ParseLocal } from '../src/parseLocal';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as shelljs from 'shelljs';
import { ParseConfluence } from '../src/parseConfluence';
import { HtmlFileTextOut } from '../src/html';

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();

let basepath: string;
let space: string;
let credentials: Credentials;
let cookies: Cookies;
let isMock: boolean | undefined;
let id: string;
let id_badFormat: string;
let id_multiplePages: string;

// Default values for ConfluenceTextIn constructor
basepath = 'https://adcenter.pl.s2-eu.capgemini.com/confluence/';
space = 'JQ';
credentials = {
  username: '',
  password: '',
};
cookies = [
  {
    name: 'brandNewDayProd',
    value: 'abcd',
  },
];
isMock = true;

// Default id values
id = 'Jump+the+queue+Home';
id_badFormat = 'bad+format';
id_multiplePages = 'multiple+pages';

// Output -> To see transcript in a file (Optional)
const outputPath01 = 'test-data/output/confluence/output1.json';
const outputFolder = './test-data/output/';
//html from confluence
let htmlFile1: string =
  'test-data/confluence-html/Jump-the-queue-Home_2163154.html';
let htmlparse = require('html-parse');
const transcript: Transcript = { segments: [] };

// TEST01
// I don´t have credentials
xdescribe('Confluence01 Testing the Input of Text and doc generation', () => {
  before(() => {
    //setup fixture
    if (fs.existsSync(outputPath01)) {
      fs.unlinkSync(outputPath01);
    }
  });

  describe('ConfluenceTextIn', () => {
    it('should return the Transcript from the external source', done => {
      const textinConfluence01 = new ConfluenceTextIn(
        basepath,
        space,
        credentials,
        isMock,
      );
      textinConfluence01
        .getTranscript(id)
        .then(transcript => {
          // To see transcript in a file (Optional). Existing path is required.
          fs.writeFileSync(
            outputPath01,
            JSON.stringify(transcript, null, 2),
            'utf8',
          );

          // Compare transcript
          const h1 = transcript.segments[2];
          if (h1.kind === 'textelement') {
            const richText = h1.text[0];
            if (richText as RichString) {
              const richString = richText as RichString;
              expect(richString.text).equals(
                '1. Project Introduction. Statement of Purpose',
              );
              done();
            } else {
              done(new Error('Expected RichString, received InlineImage'));
            }
          } else {
            done(new Error('Not a valid h1 element'));
          }
        })
        .catch(error => {
          done(error);
        });
    });
  });

  after(() => {
    // clean fixture
    try {
      shelljs.rm(outputPath01);
    } catch (error) {
      throw error;
    }
  });
});

describe('Confluence02 from html to Transcript', () => {
  before(() => {
    //setup fixture
  });

  describe('html text in', () => {
    it('Obtaining the Transcript object from html', done => {
      const end: Array<TextSegment> = [];
      try {
        const htmlView = fs.readFileSync(htmlFile1);
        const tree = htmlparse.parse(htmlView);
        ParseConfluence.base = 'test-data/confluence-html';
        for (const branch of tree) {
          const temp = ParseConfluence.recursive(branch);
          for (const final of temp) {
            end.push(final);
          }
        }
        transcript.segments = end;
        expect(transcript.segments[0].kind).equals('list');
        let listObject1 = transcript.segments[0] as List;
        expect(listObject1.ordered).true;

        done();
      } catch (error) {
        done(error);
      }
    });
  });

  after(() => {
    // clean fixture
  });
});

describe('Confluence03 from Transcript to asciidoc', () => {
  before(() => {
    //setup fixture
  });

  describe('From transcript to asciidoc', () => {
    it('Obtaining the asciidoc', done => {
      let transcripts: Transcript[] = [];
      transcripts.push(transcript);
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'outJumpTheQueue',
      );
      out.generate(transcripts).then(() => {
        done();
      });
    });
  });

  after(() => {
    // clean fixture
  });
});
//errors in asciidoctor from ascii to html because the html file from confluence is messy
xdescribe('Confluence04 from Transcript to html', () => {
  before(() => {
    //setup fixture
  });

  describe('From transcript to html', () => {
    it('Obtaining the html', done => {
      let transcripts: Transcript[] = [];
      transcripts.push(transcript);
      let out: HtmlFileTextOut = new HtmlFileTextOut(
        outputFolder + 'outJumpTheQueue',
      );
      out.generate(transcripts).then(() => {
        done();
      });
    });
  });

  after(() => {
    // clean fixture
  });
});

// TEST02: Testing common fails
/* xdescribe('Confluence02 Testing common fails', () => {
  before(() => {
    //setup fixture
  });

  // Input parameters
  describe('ConfluenceTextIn', () => {
    it('getTranscript should work with the proper input parameters', done => {
      const textinConfluence02 = new ConfluenceTextIn(
        'http://localhost:8090/',
        'JQ',
        credentials,
        true,
      );
      textinConfluence02
        .getTranscript(id)
        .then(transcript => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    // Bad case I: Title blank
    it('getTranscript should complain when some input parameter are no correct I: Title cannot be blank', done => {
      const textinConfluence02 = new ConfluenceTextIn(
        'http://localhost:8090/',
        'JQ',
        credentials,
        true,
      );
      expect(textinConfluence02.getTranscript('')).to.eventually.throw(
        'Title cannot be blank',
      );
      done();
    });

    // Bad case II: BaseURL blank
    it('getTranscript should complain when some input parameter are no correct II: BaseURL cannot be blank', done => {
      const textinConfluence02a = new ConfluenceTextIn(
        '',
        'JQ',
        credentials,
        true,
      );
      expect(textinConfluence02a.getTranscript(id)).to.eventually.throw(
        'ConfluenceTextIn: BaseURL cannot be blank.',
      ); // -> Error messages should be chaged for error codes (Linked to an error message) in upcoming version. It scales better.
      done();
    });

    // Bad case III: SpaceKey undefined
    it('getTranscript should complain when some input parameter are no correct III: SpaceKey cannot be undefined', done => {
      const textinConfluence02b = new ConfluenceTextIn(
        'http://localhost:8090/',
        undefined,
        credentials,
        true,
      );
      expect(textinConfluence02b.getTranscript(id)).to.eventually.throw(
        'ConfluenceTextIn: SpaceKey is undefined.',
      );
      done();
    });

    // Bad case IV: SpaceKey blank
    it('getTranscript should complain when some input parameter are no correct IV: SpaceKey cannot be blank', done => {
      const textinConfluence02c = new ConfluenceTextIn(
        'http://localhost:8090/',
        '',
        credentials,
        true,
      );
      expect(textinConfluence02c.getTranscript(id)).to.eventually.throw(
        'ConfluenceTextIn: SpaceKey cannot be blank.',
      );
      done();
    });

    // Bad case V: A combination of some of the above
    it('getTranscript should complain when some input parameter are no correct V', done => {
      const textinConfluence02d = new ConfluenceTextIn(
        '',
        '',
        credentials,
        true,
      );
      expect(textinConfluence02d.getTranscript('')).to.eventually.throw();
      done();
    });
  });

  after(() => {
    // clean fixture
  });
});

// TEST03: Processing Data
const textinConfluence03 = new ConfluenceTextIn(
  'http://localhost:8090/',
  'JQ',
  credentials,
  true,
);
xdescribe('Confluence03 Testing data processing', () => {
  before(() => {
    //setup fixture
  });

  // Input parameters
  describe('ConfluenceTextIn', () => {
    // Good case
    it('getTranscript should work with the proper input parameters', done => {
      textinConfluence03
        .getTranscript(id)
        .then(transcript => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });

    // Bad case I: More than one confluence page at once
    it('getTranscript should complain when received data contains more than one page at once', done => {
      expect(
        textinConfluence03.getTranscript(id_multiplePages),
      ).to.eventually.throw(
        'Only one Confluence page is allowed at once in this version. Check your request please.',
      );
      done();
    });

    // Bad case II: JSON is not in a proper format
    it('getTranscript should complain when received is not in a proper format', done => {
      expect(
        textinConfluence03.getTranscript(id_badFormat),
      ).to.eventually.throw(
        'Received JSON from Confluence is not in a proper format.',
      );
      done();
    });
  });

  after(() => {
    // clean fixture
  });
});

// TEST04: Auth by cookies is not implemented yet
const textinConfluence04 = new ConfluenceTextIn(
  'http://localhost:8090/',
  'JQ',
  cookies,
  true,
);
xdescribe('Confluence04 Testing data processing', () => {
  before(() => {
    //setup fixture
  });

  // Bad auth
  describe('ConfluenceTextIn', () => {
    // Auth by cookies
    it('getTranscript should complain when trying to authenticate by cookies: Not implemented', done => {
      expect(textinConfluence04.getTranscript(id)).to.eventually.throw(
        'Not implemented yet',
      );
      done();
    });
  });

  after(() => {
    // clean fixture
  });
}); */
