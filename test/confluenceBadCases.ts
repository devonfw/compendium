import {
  TextIn,
  Credentials,
  TextOut,
  RichText,
  RichString,
  Cookies,
  Transcript,
  TextSegment,
} from '../src/types';
import { ConfluenceTextIn } from '../src/confluenceInput';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import { HtmlFileTextOut } from '../src/htmlOutput';
import { PdfFileTextOut } from '../src/pdfOutput';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();

let basepath: string;
let space: string;
let credentials: Credentials;
let cookies: Cookies;
let id: string;
let id_badFormat: string;
let id_multiplePages: string;

// Default values for ConfluenceTextIn constructor
basepath = 'https://murtasanjuanases.atlassian.net/wiki/';
space = 'PD';
credentials = {
  username: 'murta.sanjuan-ases-external@capgemini.com',
  password: 'Admin1234',
};
cookies = [
  {
    name: 'brandNewDayProd',
    value: 'abcd',
  },
];
let transcripts: Transcript[] = [];
let transcript: Transcript = { segments: [] };
const segments1: Array<TextSegment> = [];
transcript.segments = segments1;
const outputFolder = 'test-data/output/confluence/';

// Default id values
id = 'Operating+Mode';
id_badFormat = 'bad+format';
id_multiplePages = 'multiple+pages';

// Output -> To see transcript in a file (Optional)
const outputPath01 = 'test-data/output/confluence/output1.json';

// TEST02: Testing common fails
describe('ConfluenceBad01 Testing common fails', () => {
  before(() => {
    //setup fixture
  });

  // Input parameters
  describe('ConfluenceTextIn bad cases', () => {
    // Bad case I: Title blank
    it('getTranscript should complain when some input parameter are no correct I: Title cannot be blank', done => {
      const textinConfluence02 = new ConfluenceTextIn(
        basepath,
        space,
        credentials,
      );
      textinConfluence02
        .getTranscript('')
        .then(transcript => {
          done(new Error('Expected method to reject.'));
        })
        .catch(error => {
          expect(error.message).to.include('Title cannot be blank');
          done();
        });
    });

    // Bad case II: BaseURL blank
    it('getTranscript should complain when some input parameter are no correct II: BaseURL cannot be blank', done => {
      const textinConfluence02a = new ConfluenceTextIn('', space, credentials);
      textinConfluence02a
        .getTranscript(id)
        .then(transcript => {
          done(new Error('Expected method to reject.'));
        })
        .catch(error => {
          expect(error.message).to.include(
            'ConfluenceTextIn: BaseURL cannot be blank.',
          );
          done();
        });
    });

    // Bad case III: SpaceKey undefined
    it('getTranscript should complain when some input parameter are no correct III: SpaceKey cannot be undefined', done => {
      const textinConfluence02b = new ConfluenceTextIn(
        basepath,
        undefined,
        credentials,
      );
      textinConfluence02b
        .getTranscript(id)
        .then(transcript => {
          done(new Error('Expected method to reject.'));
        })
        .catch(error => {
          expect(error.message).to.include(
            'ConfluenceTextIn: SpaceKey is undefined.',
          );
          done();
        });
    });

    // Bad case IV: SpaceKey blank
    it('getTranscript should complain when some input parameter are no correct IV: SpaceKey cannot be blank', done => {
      const textinConfluence02c = new ConfluenceTextIn(
        basepath,
        '',
        credentials,
      );
      textinConfluence02c
        .getTranscript(id)
        .then(transcript => {
          done(new Error('Expected method to reject.'));
        })
        .catch(error => {
          expect(error.message).to.include(
            'ConfluenceTextIn: SpaceKey cannot be blank.',
          );
          done();
        });
    });
  });

  after(() => {
    // clean fixture
  });
});

// TEST03: Processing Data
//credentials have expired create new account to test this part
const textinConfluence03 = new ConfluenceTextIn(basepath, space, credentials);
describe('ConfluenceBad02 Testing data processing', () => {
  before(() => {
    //setup fixture
  });

  // Input parameters
  describe('ConfluenceTextIn', () => {
    // Bad case I: JSON is not in a proper format
    it('getTranscript should complain when received is not in a proper format', done => {
      textinConfluence03
        .getTranscript(id_badFormat)
        .then(transcript => {
          done(new Error('Expected method to reject.'));
        })
        .catch(error => {
          expect(error.message).to.include(
            "It isn't possible to get the content from confluence",
          );
          done();
        });
    });
  });

  after(() => {
    // clean fixture
  });
});
