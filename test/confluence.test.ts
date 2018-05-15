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
import { ConfluenceTextIn } from '../src/confluence';
import { AsciiDocFileTextOut } from '../src/asciidocOutput';
import { HtmlFileTextOut } from '../src/html';
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

// TEST01
// Should get content from Murta's space

describe('Confluence01 Testing the Output and Input of Text and doc generation', () => {
  before(done => {
    if (fs.existsSync(outputPath01)) {
      fs.unlinkSync(outputPath01);
    }
    //setup fixture
    const textinConfluence01 = new ConfluenceTextIn(
      basepath,
      space,
      credentials,
    );
    textinConfluence01
      .getTranscript(id)
      .then(transcriptObject => {
        //save the transcript for other test
        transcripts = [];
        transcripts.push(transcriptObject);
        transcript = transcripts[0];

        // Compare transcript
        done();
      })
      .catch(error => {
        done(error);
      });
  });
  describe('Input', () => {
    it('input', done => {
      // To see transcript in a file (Optional). Existing path is required.
      fs.writeFileSync(
        outputPath01,
        JSON.stringify(transcript, null, 2),
        'utf8',
      );

      done();
    });
  });
  describe('Input', () => {
    it('To asciidoc', done => {
      let out: AsciiDocFileTextOut = new AsciiDocFileTextOut(
        outputFolder + 'confluence01',
      );

      out
        .generate(transcripts)
        .then(() => {
          done();
        })
        .catch(error => {
          done(error);
        });
    });
  });
  after(() => {
    // clean fixture
  });
});

// TEST02: Testing common fails
/* describe('Confluence02 Testing common fails', () => {
    before(() => {
        //setup fixture
    });

    // Input parameters
    describe('ConfluenceTextIn', () => {

        it('getTranscript should work with the proper input parameters', (done) => {
            const textinConfluence02 = new ConfluenceTextIn('http://localhost:8090/', 'JQ', credentials, true);
            textinConfluence02.getTranscript(id).then((transcript) => {
                done();
            }).catch((error) => {
                done(error);
            });
        });

        // Bad case I: Title blank
        it('getTranscript should complain when some input parameter are no correct I: Title cannot be blank', (done) => {
            const textinConfluence02 = new ConfluenceTextIn('http://localhost:8090/', 'JQ', credentials, true);
            expect(textinConfluence02.getTranscript('')).to.eventually.throw('Title cannot be blank');
            done();
        });

        // Bad case II: BaseURL blank
        it('getTranscript should complain when some input parameter are no correct II: BaseURL cannot be blank', (done) => {
            const textinConfluence02a = new ConfluenceTextIn('', 'JQ', credentials, true);
            expect(textinConfluence02a.getTranscript(id)).to.eventually.throw('ConfluenceTextIn: BaseURL cannot be blank.'); // -> Error messages should be chaged for error codes (Linked to an error message) in upcoming version. It scales better.
            done();
        });

        // Bad case III: SpaceKey undefined
        it('getTranscript should complain when some input parameter are no correct III: SpaceKey cannot be undefined', (done) => {
            const textinConfluence02b = new ConfluenceTextIn('http://localhost:8090/', undefined, credentials, true);
            expect(textinConfluence02b.getTranscript(id)).to.eventually.throw('ConfluenceTextIn: SpaceKey is undefined.');
            done();
        });

        // Bad case IV: SpaceKey blank
        it('getTranscript should complain when some input parameter are no correct IV: SpaceKey cannot be blank', (done) => {
            const textinConfluence02c = new ConfluenceTextIn('http://localhost:8090/', '', credentials, true);
            expect(textinConfluence02c.getTranscript(id)).to.eventually.throw('ConfluenceTextIn: SpaceKey cannot be blank.');
            done();
        });

        // Bad case V: A combination of some of the above
        it('getTranscript should complain when some input parameter are no correct V', (done) => {
            const textinConfluence02d = new ConfluenceTextIn('', '', credentials, true);
            expect(textinConfluence02d.getTranscript('')).to.eventually.throw();
            done();
        });
    });

    after(() => {
        // clean fixture
    });
});

// TEST03: Processing Data
const textinConfluence03 = new ConfluenceTextIn('http://localhost:8090/', 'JQ', credentials, true);
describe('Confluence03 Testing data processing', () => {
    before(() => {
        //setup fixture
    });

    // Input parameters
    describe('ConfluenceTextIn', () => {

        // Good case
        it('getTranscript should work with the proper input parameters', (done) => {
            textinConfluence03.getTranscript(id).then((transcript) => {
                done();
            }).catch((error) => {
                done(error);
            });
        });

        // Bad case I: More than one confluence page at once
        it('getTranscript should complain when received data contains more than one page at once', (done) => {
            expect(textinConfluence03.getTranscript(id_multiplePages)).to.eventually.throw('Only one Confluence page is allowed at once in this version. Check your request please.');
            done();
        });

        // Bad case II: JSON is not in a proper format
        it('getTranscript should complain when received is not in a proper format', (done) => {
            expect(textinConfluence03.getTranscript(id_badFormat)).to.eventually.throw('Received JSON from Confluence is not in a proper format.');
            done();
        });

    });

    after(() => {
        // clean fixture
    });
});

// TEST04: Auth by cookies is not implemented yet
const textinConfluence04 = new ConfluenceTextIn('http://localhost:8090/', 'JQ', cookies, true);
describe('Confluence04 Testing data processing', () => {
    before(() => {
        //setup fixture
    });

    // Bad auth
    describe('ConfluenceTextIn', () => {

        // Auth by cookies
        it('getTranscript should complain when trying to authenticate by cookies: Not implemented', (done) => {
            expect(textinConfluence04.getTranscript(id)).to.eventually.throw('Not implemented yet');
            done();
        });

    });

    after(() => {
        // clean fixture
    });
}); */
