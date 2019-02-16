/* globals describe, it */
var assert = require('chai').assert,
    isWindows = require('is-windows'),
    createMap = require('istanbul-lib-coverage').createCoverageMap,
    SMC = require('source-map').SourceMapConsumer,
    createTransformer = require('../lib/transformer').create,
    coverageData = {
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

function createData() {
    var data = Object.assign({}, coverageData);
    data.path = '/path/to/file.js';
    return {
        sourceMap: {
            version: 3,
            sources: ['file.js'],
            mappings: ';AAAa,mBAAW,GAAG,MAAM,CAAC;AACrB,kBAAU,GAAG,yBAAyB,CAAC'
        },
        coverageData: data
    };
}

function createDataBackslash() {
    var data = Object.assign({}, coverageData);
    data.path = '\\path\\to\\file.js';
    return {
        coverageData: data
    };
}

describe('transformer', function() {
    it('maps statement locations', function() {
        if (isWindows()) {
            return this.skip();
        }

        var coverageMap = createMap({}),
            testData = createData(),
            coverageData = testData.coverageData,
            sourceMap = testData.sourceMap;

        coverageMap.addFileCoverage(coverageData);
        var mapped = createTransformer(function() {
            return new SMC(sourceMap);
        }).transform(coverageMap);

        assert.deepEqual(mapped.data[coverageData.path].statementMap, {
            '0': {
                start: { line: 1, column: 13 },
                end: { line: 1, column: 34 }
            },
            '1': {
                start: { line: 2, column: 13 },
                end: { line: 2, column: 52 }
            }
        });
    });

    it('maps each file only once, /path/to/file.js and \\path\\to\\file.js are the same file', function() {
        if (isWindows()) {
            return this.skip();
        }

        var coverageMap = createMap({}),
            testDataSlash = createData(),
            testDataBackslash = createDataBackslash(),
            coverageDataSlash = testDataSlash.coverageData,
            coverageDataBackslash = testDataBackslash.coverageData,
            sourceMap = testDataSlash.sourceMap;

        coverageMap.addFileCoverage(coverageDataSlash);
        coverageMap.addFileCoverage(coverageDataBackslash);

        var mapped = createTransformer(function(file) {
            return file === coverageDataSlash.path
                ? new SMC(sourceMap)
                : undefined;
        }).transform(coverageMap);

        assert.equal(Object.keys(mapped.data).length, 1);
        assert.isDefined(mapped.data[coverageDataBackslash.path]);
    });
});
