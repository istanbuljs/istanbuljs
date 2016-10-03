/* globals describe, it */
var assert = require('chai').assert,
    createMap = require('istanbul-lib-coverage').createCoverageMap,
    SMC = require('source-map').SourceMapConsumer,
    createTransformer = require('../lib/transformer').create;

function createData() {
    var sourceMap = {
        "version": 3,
        "sources": [
            "file.js"
        ],
        "mappings": ";AAAa,mBAAW,GAAG,MAAM,CAAC;AACrB,kBAAU,GAAG,yBAAyB,CAAC"
    };

    var coverageData = {
        "path": "/path/to/file.js",
        "statementMap": {
            "0": {
                "start": {
                    "line": 2,
                    "column": 0
                },
                "end": {
                    "line": 2,
                    "column": 29
                }
            },
            "1": {
                "start": {
                    "line": 3,
                    "column": 0
                },
                "end": {
                    "line": 3,
                    "column": 47
                }
            }
        },
        "fnMap": {},
        "branchMap": {},
        "s": {
            "0": 0,
            "1": 0,
            "2": 0
        },
        "f": {},
        "b": {}
    };

    return {
        sourceMap: sourceMap,
        coverageData: coverageData
    };
}

describe('transformer', function () {
    it('maps statement locations', function () {
        var coverageMap = createMap({}),
            testData = createData(),
            coverageData = testData.coverageData,
            sourceMap = testData.sourceMap;

        coverageMap.addFileCoverage(coverageData);
        var mapped = createTransformer(function() {
            return new SMC(sourceMap);
        }).transform(coverageMap);

        assert.deepEqual(mapped.data[coverageData.path].statementMap, {
            '0': { start: { line: 1, column: 13 }, end: { line: 1, column: 34 } },
            '1': { start: { line: 2, column: 13 }, end: { line: 2, column: 52 } }
        });
    });
});

