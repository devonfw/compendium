import { ConfigFile } from './../src/config';
import { DocConfig, Index } from './../src/types';
import { DocConfigMock } from '../src/mocks/impl';

import * as config from '../src/config';
import * as fs from 'fs';

import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

const expect = chai.expect;
const assert = chai.assert;
const should = chai.should();

const configMock = '../compendium/src/mocks/configMock.json';
const docConfigMock = new ConfigFile(configMock);

describe('Testing the config and index creation', () => {
    before(() => {
        //setup fixture
    });

    describe('ConfigFile', () => {
        it('should show ', (done) => {
            docConfigMock.getIndex().then((index) => {

                assert.isArray(index, 'Index must be an array');
                assert.isArray(index[0], 'Souces must be an array');
                assert.isArray(index[1], 'Nodes must be an array');

                expect(index[0]).have.lengthOf(2, 'There are two sources');
                expect(index[1]).have.lengthOf(2, 'There are two nodes');

                expect(index[0][0].key).equals('input-data1');
                expect(index[0][0].kind).equals('asciidoc');
                expect(index[0][0].source).equals('./src/mocks/input-data1');

                expect(index[0][1].key).equals('input-data2');
                expect(index[0][1].kind).equals('asciidoc');
                expect(index[0][1].source).equals('./src/mocks/input-data2');

                expect(index[1][0].key).equals('input-data1');
                expect(index[1][0].index).equals('brownfox.adoc');

                expect(index[1][1].key).equals('input-data2');
                expect(index[1][1].index).equals('brownfox2.adoc');

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