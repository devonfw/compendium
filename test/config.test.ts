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

// Per user configuration (for now; in the upcoming version path will be relative)

const pathBaseJURUBIOG = 'C:/Projects/Compendium/compendium';
const pathBaseSBADENES = 'C:/Users/sbadenes/Desktop/Compendium/compendium';
const pathBaseAREDOMAR = 'C:/Users/aredomar/Desktop/repos/compendium';

const pathBase = pathBaseSBADENES;

// ---

// Properly written configuration files
const configMock = '../compendium/src/mocks/configMock.json';
const configTest1 = '../compendium/test-data/confiles/good/configTest1.json';

// Configuration files intentionally misspelled
const duplicatesSources_config = '../compendium/test-data/confiles/bad/duplicateSources.json';
const orphanNodes_config = '../compendium/test-data/confiles/bad/orphanNodes.json';
const badProperties_config = '../compendium/test-data/confiles/bad/badProperties.json';

const docConfigMock = new ConfigFile(configMock);
const docConfigOK = new ConfigFile(configTest1);
const docConfigDuplicateSources = new ConfigFile(duplicatesSources_config);
const docConfigOrphanNodes = new ConfigFile(orphanNodes_config);
const docConfigBadProperties = new ConfigFile(badProperties_config);

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

describe('Testing that the configuration validation is working properly (config.test.ts)', () => {
    before(() => {
        //setup fixture
    });

    describe('ConfigFile', () => {

        // Good case
        it('should generate an index when is properly written', (done) => {
            docConfigOK.getIndex().then((index) => {
                //console.log(index);
                done();
            }).catch((error) => {
                done(error);
            });
        });

        // Required properties/values
        it('must necessarily have some properties and values', (done) => {
            expect(docConfigBadProperties.getIndex()).to.eventually.throw('don\'t have a valid property/value');
            done();
        });

        // Duplicate keys
        it('shouldn\'t have duplicate source keys', (done) => {
            expect(docConfigDuplicateSources.getIndex()).to.eventually.throw('some sources have the same key');
            done();
        });

        // Orphan nodes
        it('shouldn\'t have orphan nodes', (done) => {
            expect(docConfigOrphanNodes.getIndex()).to.eventually.throw('doesn\'t have a linked source.');
            done();
        });

    });

    after(() => {
        // clean fixture
    });
});