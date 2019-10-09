'use strict';
/* globals describe, it */
const path = require('path');
const assert = require('chai').assert;
const createMap = require('istanbul-lib-coverage').createCoverageMap;
const { SourceMapConsumer } = require('source-map');
const { SourceMapTransformer } = require('../lib/transformer');

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

const sourceFileSlash = path.posix.normalize('/path/to/file.js');
const sourceFileBackslash = path.win32.normalize('/path/to/file.js');

const testDataSlash = {
    sourceMap: {
        version: 3,
        sources: [sourceFileSlash],
        mappings: ';AAAa,mBAAW,GAAG,MAAM,CAAC;AACrB,kBAAU,GAAG,yBAAyB,CAAC'
    },
    coverageData: {
        ...coverageData,
        path: sourceFileSlash
    }
};

const testDataBackslash = {
    coverageData: {
        ...coverageData,
        path: sourceFileBackslash
    }
};

describe('transformer', () => {
    it('maps statement locations', async () => {
        const coverageMap = createMap({});
        coverageMap.addFileCoverage(testDataSlash.coverageData);

        const transformer = new SourceMapTransformer(
            () => new SourceMapConsumer(testDataSlash.sourceMap)
        );
        const mapped = await transformer.transform(coverageMap);

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

    it('maps each file only once, /path/to/file.js and \\path\\to\\file.js are the same file', async () => {
        const coverageMap = createMap({});

        coverageMap.addFileCoverage(testDataSlash.coverageData);
        coverageMap.addFileCoverage(testDataBackslash.coverageData);

        const transformer = new SourceMapTransformer(file =>
            file === testDataSlash.coverageData.path
                ? new SourceMapConsumer(testDataSlash.sourceMap)
                : undefined
        );
        const mapped = await transformer.transform(coverageMap);

        assert.equal(Object.keys(mapped.data).length, 1);
        assert.isDefined(mapped.data[testDataBackslash.coverageData.path]);
    });
});
