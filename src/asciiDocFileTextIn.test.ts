import { AsciiDocFileTextIn } from './../src/asciiDocFileTextIn';

import { TextIn } from '../src/types';
import { TextInMock } from '../src/mocks/impl';
//import * as chai from 'chai';

let textin = new AsciiDocFileTextIn('test-data');

//const expect = chai.expect;
//const should = chai.should();


describe('Testing AsciiDocFileTextIn', () => {
    before(() => {
        //setup fixture
        console.log('Testing AsciiDocFileTextIn');
    });

    describe('AsciiDocFileTextIn', () => {
        it('should split the data into a string array', (done) => {
            textin.getTranscript('example1.adoc').then((transcript) => {

                console.log('Transcript is pending');  
                done();
                
            }).catch((error) => {
                done(error);
            });
        });
    });

    after(() => {
        // clean fixture
    });
});