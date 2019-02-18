/* globals describe, it */
const path = require('path');
const assert = require('chai').assert;
const createMap = require('istanbul-lib-coverage').createCoverageMap;
const SMC = require('source-map').SourceMapConsumer;
const createTransformer = require('../lib/transformer').create;

const coverageData = {
    statementMap: {
        '0': {
            start: { line: 2, column: 0 },
            end: { line: 2, column: 29 }
        },
        '1': {
            start: { line: 3, column: 0 },
            end: { line: 3, column: 47 }
        }
    },
    fnMap: {},
    branchMap: {},
    s: {
        '0': 0,
        '1': 0,
        '2': 0
    },
    f: {},
    b: {}
};

const sourceFileSlash = path
    .join(__dirname, 'path/to/file.js')
    .replace(/\\/g, '/');

const sourceFileBackslash = path
    .join(__dirname, 'path\\to\\file.js')
    .replace(/\//g, '\\');

const testDataSlash = {
    sourceMap: {
        version: 3,
        sources: [sourceFileSlash],
        mappings: ';AAAa,mBAAW,GAAG,MAAM,CAAC;AACrB,kBAAU,GAAG,yBAAyB,CAAC'
    },
    coverageData: Object.assign({}, coverageData, {
        path: sourceFileSlash
    })
};

const testDataBackslash = {
    coverageData: Object.assign({}, coverageData, {
        path: sourceFileBackslash
    })
};

describe('transformer', function() {
    it('maps statement locations', function() {
        const coverageMap = createMap({});
        coverageMap.addFileCoverage(testDataSlash.coverageData);

        const mapped = createTransformer(function() {
            return new SMC(testDataSlash.sourceMap);
        }).transform(coverageMap);

        assert.deepEqual(
            mapped.data[testDataSlash.coverageData.path].statementMap,
            {
                '0': {
                    start: { line: 1, column: 13 },
                    end: { line: 1, column: 34 }
                },
                '1': {
                    start: { line: 2, column: 13 },
                    end: { line: 2, column: 52 }
                }
            }
        );
    });

    it('maps each file only once, /path/to/file.js and \\path\\to\\file.js are the same file', function() {
        const coverageMap = createMap({});

        coverageMap.addFileCoverage(testDataSlash.coverageData);
        coverageMap.addFileCoverage(testDataBackslash.coverageData);

        const mapped = createTransformer(function(file) {
            return file === testDataSlash.coverageData.path
                ? new SMC(testDataSlash.sourceMap)
                : undefined;
        }).transform(coverageMap);

        assert.equal(Object.keys(mapped.data).length, 1);
        assert.isDefined(mapped.data[testDataBackslash.coverageData.path]);
    });
});
