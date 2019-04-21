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

const sourceFileSlash = path.posix.normalize('/path/to/file.js');
const sourceFileBackslash = path.win32.normalize('/path/to/file.js');

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

function createBranchData() {
    // typescript source code is
    /*
    export type Z = {
        b?(): string;
    }

    export type M = {
        b?(): number;
    }


    function f(z: Z) {
        const result: M = {};
        if ('b' in z) {
            result.b = () => parseInt(z.b!(), 10);
        }
        return result;
    }

    export {f};
    */
    // compiled javascript is
    /*
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    function f(z) {
        const result = {};
        if ('b' in z) {
            result.b = () => parseInt(z.b(), 10);
        }
        return result;
    }
    exports.f = f;
    //# sourceMappingURL=data.js.map
    */
    const sourceMap = {
        version: 3,
        file: 'data.js',
        sourceRoot: '',
        sources: ['data.ts'],
        names: [],
        mappings:
            ';;AASA,SAAS,CAAC,CAAC,CAAI;IACX,MAAM,MAAM,GAAM,EAAE,CAAC;IACrB,IAAI,GAAG,IAAI,CAAC,EAAE;QACV,MAAM,CAAC,CAAC,GAAG,GAAG,EAAE,CAAC,QAAQ,CAAC,CAAC,CAAC,CAAE,EAAE,EAAE,EAAE,CAAC,CAAC;KACzC;IACD,OAAO,MAAM,CAAC;AAClB,CAAC;AAEO,cAAC'
    };

    const coverageData = {
        path: '/data.js',
        statementMap: {
            '0': {
                // line 2: Object.defineProperty(exports, "__esModule", { value: true });
                start: { line: 2, column: 0 },
                end: { line: 2, column: 62 }
            },
            '1': {
                // line 4 after assignment:  {};
                start: { line: 4, column: 19 },
                end: { line: 4, column: 21 }
            },
            '2': {
                // lines 5-7 if statement
                start: { line: 5, column: 4 },
                end: { line: 7, column: 5 }
            },
            '3': {
                // line 6 assignment inside if branch: result.b = () => parseInt(z.b(), 10);
                start: { line: 6, column: 8 },
                end: { line: 6, column: 45 }
            },
            '4': {
                // line 6 arrow function body:  parseInt(z.b(), 10)
                start: { line: 6, column: 25 },
                end: { line: 6, column: 44 }
            },
            '5': {
                // line 8: return result;
                start: { line: 8, column: 4 },
                end: { line: 8, column: 18 }
            },
            '6': {
                // line 10: exports.f = f;
                start: { line: 10, column: 0 },
                end: { line: 10, column: 14 }
            }
        },
        fnMap: {
            '0': {
                name: 'f',
                decl: {
                    start: { line: 3, column: 9 },
                    end: { line: 3, column: 10 }
                },
                loc: {
                    start: { line: 3, column: 14 },
                    end: { line: 9, column: 1 }
                },
                line: 3
            },
            '1': {
                name: '(anonymous_1)',
                decl: {
                    start: { line: 6, column: 19 },
                    end: { line: 6, column: 20 }
                },
                loc: {
                    start: { line: 6, column: 25 },
                    end: { line: 6, column: 44 }
                },
                line: 6
            }
        },
        branchMap: {
            '0': {
                loc: {
                    start: { line: 5, column: 4 },
                    end: { line: 7, column: 5 }
                },
                type: 'if',
                locations: [
                    {
                        start: { line: 5, column: 4 },
                        end: { line: 7, column: 5 }
                    },
                    {
                        start: { line: 5, column: 4 },
                        end: { line: 7, column: 5 }
                    }
                ],
                line: 5
            }
        },
        s: { '0': 1, '1': 1, '2': 1, '3': 1, '4': 1, '5': 1, '6': 1 },
        f: { '0': 1, '1': 1 },
        b: { '0': [1, 0] }
    };

    return {
        sourceMap,
        coverageData
    };
}

describe('transformer', () => {
    it('maps statement locations', () => {
        const coverageMap = createMap({});
        coverageMap.addFileCoverage(testDataSlash.coverageData);

        const mapped = createTransformer(
            () => new SMC(testDataSlash.sourceMap)
        ).transform(coverageMap);

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

    it('maps branch locations', () => {
        const coverageMap = createMap({});
        const testData = createBranchData();
        const coverageData = testData.coverageData;
        const sourceMap = testData.sourceMap;

        coverageMap.addFileCoverage(coverageData);

        const mapped = createTransformer(() => new SMC(sourceMap)).transform(
            coverageMap
        );

        const mappedData = mapped.data['/data.ts'].data;

        assert.deepEqual(mappedData.statementMap, {
            '0': {
                start: { line: 11, column: 22 },
                end: { line: 11, column: 24 }
            },
            /* // that's an if statement on lines 12-14 went missing
               // it should be uncommented when https://github.com/istanbuljs/nyc/issues/1049 is fixed
                      '1': {
                        start: { line: 12, column: 4 },
                        end: { line: 14, column: 5 } },
            */
            '1': {
                start: { line: 13, column: 8 },
                end: { line: 13, column: 46 }
            },
            '2': {
                start: { line: 13, column: 25 },
                end: { line: 13, column: 45 }
            },
            '3': {
                start: { line: 15, column: 4 },
                end: { line: 15, column: 18 }
            },
            '4': {
                start: { line: 18, column: 8 },
                end: { line: 18, column: 9 }
            }
        });

        assert.deepEqual(mappedData.fnMap, {
            '0': {
                name: 'f',
                decl: {
                    start: { line: 10, column: 9 },
                    end: { line: 10, column: 10 }
                },
                loc: {
                    start: { line: 10, column: 15 },
                    end: { line: 16, column: 1 }
                }
            },
            '1': {
                name: '(anonymous_1)',
                decl: {
                    start: { line: 13, column: 19 },
                    end: { line: 13, column: 22 }
                },
                loc: {
                    start: { line: 13, column: 25 },
                    end: { line: 13, column: 45 }
                }
            }
        });

        assert.deepEqual(mappedData.branchMap, {
            /*
            '0': {
              loc: {
                start: { line: 12, column: 4 },
                end: { line: 14, column: 5 }
              },
              type: 'if',
              locations: [
                {
                  start: { line: 12, column: 4 },
                  end: { line: 14, column: 5 }
                },
                {
                  start: { line: 12, column: 4 },
                  end: { line: 14, column: 5 }
                }
              ]
            }
            */
        });
    });

    it('maps each file only once, /path/to/file.js and \\path\\to\\file.js are the same file', () => {
        const coverageMap = createMap({});

        coverageMap.addFileCoverage(testDataSlash.coverageData);
        coverageMap.addFileCoverage(testDataBackslash.coverageData);

        const mapped = createTransformer(file =>
            file === testDataSlash.coverageData.path
                ? new SMC(testDataSlash.sourceMap)
                : undefined
        ).transform(coverageMap);

        assert.equal(Object.keys(mapped.data).length, 1);
        assert.isDefined(mapped.data[testDataBackslash.coverageData.path]);
    });
});
