'use strict';
/* globals describe, it */

const assert = require('chai').assert;
const {
    FileCoverage,
    addHits,
    findNearestContainer,
    addNearestContainerHits
} = require('../lib/file-coverage');
const { CoverageSummary } = require('../lib/coverage-summary');

describe('coverage summary', () => {
    it('allows a noop constructor', () => {
        const cs = new CoverageSummary();
        assert.ok(cs.statements);
        assert.ok(cs.lines);
        assert.ok(cs.functions);
        assert.ok(cs.branches);
        assert.ok(cs.branchesTrue);
    });

    it('allows another summary in constructor', () => {
        const cs1 = new CoverageSummary();
        assert.doesNotThrow(() => {
            new CoverageSummary(cs1);
        });
    });

    it('allows summary data in constructor', () => {
        const cs1 = new CoverageSummary();
        assert.doesNotThrow(() => {
            new CoverageSummary(cs1.data);
        });
    });

    it('can be initialized with non-zero totals', () => {
        const cs = new CoverageSummary().data;
        cs.statements.total = 5;
        cs.statements.covered = 4;
        cs.statements.skipped = 0;
        cs.statements.pct = 80;
        const cs2 = new CoverageSummary(cs);
        assert.deepEqual(cs2.statements, {
            total: 5,
            covered: 4,
            skipped: 0,
            pct: 80
        });
    });

    it('cannot be initialized with an object with missing keys', () => {
        assert.throws(() => {
            new CoverageSummary({ statements: {} });
        });
    });

    it('merges summaries correctly', () => {
        const basic = function() {
            return {
                total: 5,
                covered: 4,
                skipped: 0,
                pct: 80
            };
        };
        const empty = function() {
            return {
                total: 0,
                covered: 0,
                skipped: 0,
                pct: 100
            };
        };
        const cs1 = new CoverageSummary({
            statements: basic(),
            functions: basic(),
            lines: basic(),
            branches: empty(),
            branchesTrue: empty()
        });
        const cs2 = new CoverageSummary({
            statements: basic(),
            functions: basic(),
            lines: basic(),
            branches: empty(),
            branchesTrue: empty()
        });
        cs2.statements.covered = 5;
        cs1.merge(cs2);
        assert.deepEqual(cs1.statements, {
            total: 10,
            covered: 9,
            skipped: 0,
            pct: 90
        });
        assert.equal(cs1.branches.pct, 100);
        assert.equal(cs1.branchesTrue.pct, 100);
        const data = JSON.parse(JSON.stringify(cs1));
        assert.deepEqual(data.statements, {
            total: 10,
            covered: 9,
            skipped: 0,
            pct: 90
        });
        assert.equal(data.branches.pct, 100);
        assert.equal(data.branchesTrue.pct, 100);
    });

    it('isEmpty() by default', () => {
        const cs = new CoverageSummary();
        assert.equal(cs.isEmpty(), true);
    });
});

describe('base coverage', () => {
    it('does not allow a noop/ invalid constructor', () => {
        assert.throws(() => {
            new FileCoverage();
        });
        assert.throws(() => {
            new FileCoverage(10);
        });
    });

    it('allows a path in constructor', () => {
        let bc = null;
        assert.doesNotThrow(() => {
            bc = new FileCoverage('/path/to/file');
        });
        assert.ok(bc.statementMap);
        assert.ok(bc.fnMap);
        assert.ok(bc.branchMap);
        assert.ok(bc.s);
        assert.ok(bc.f);
        assert.ok(bc.b);
        assert.ok(bc.getLineCoverage());
        assert.equal(bc.path, '/path/to/file');
    });

    it('allows another object in constructor, produces JSON', () => {
        const bc1 = new FileCoverage('/path/to/file');
        const bc2 = new FileCoverage(bc1);
        assert.equal(bc2.path, '/path/to/file');

        const bc3 = new FileCoverage(bc1.data);
        assert.equal(bc3.path, '/path/to/file');
        assert.deepEqual(bc1.data, JSON.parse(JSON.stringify(bc3)));

        delete bc3.data.s;
        assert.throws(() => {
            new FileCoverage(bc3.data);
        });
    });

    it('merges another file coverage correctly', () => {
        const loc = function(sl, sc, el, ec) {
            return {
                start: { line: sl, column: sc },
                end: { line: el, column: ec }
            };
        };
        const template = new FileCoverage({
            path: '/path/to/file',
            statementMap: {
                0: loc(1, 1, 1, 100),
                1: loc(2, 1, 2, 50),
                2: loc(2, 51, 2, 100),
                3: loc(2, 101, 3, 100)
            },
            fnMap: {
                0: {
                    name: 'foobar',
                    line: 1,
                    loc: loc(1, 1, 1, 50)
                }
            },
            branchMap: {
                0: {
                    type: 'if',
                    line: 2,
                    locations: [loc(2, 1, 2, 20), loc(2, 50, 2, 100)]
                }
            },
            s: {
                0: 0,
                1: 0,
                2: 0,
                3: 0
            },
            f: {
                0: 0
            },
            b: {
                0: [0, 0]
            }
        });
        const clone = function(obj) {
            return JSON.parse(JSON.stringify(obj));
        };
        const c1 = new FileCoverage(clone(template));
        const c2 = new FileCoverage(clone(template));
        let summary;

        c1.s[0] = 1;
        c1.f[0] = 1;
        c1.b[0][0] = 1;

        c2.s[1] = 1;
        c2.f[0] = 1;
        c2.b[0][1] = 2;
        summary = c1.toSummary();
        assert.ok(summary instanceof CoverageSummary);
        assert.deepEqual(summary.statements, {
            total: 4,
            covered: 1,
            skipped: 0,
            pct: 25
        });
        assert.deepEqual(summary.lines, {
            total: 2,
            covered: 1,
            skipped: 0,
            pct: 50
        });
        assert.deepEqual(summary.functions, {
            total: 1,
            covered: 1,
            skipped: 0,
            pct: 100
        });
        assert.deepEqual(summary.branches, {
            total: 2,
            covered: 1,
            skipped: 0,
            pct: 50
        });

        c1.merge(c2);
        summary = c1.toSummary();
        assert.deepEqual(summary.statements, {
            total: 4,
            covered: 2,
            skipped: 0,
            pct: 50
        });
        assert.deepEqual(summary.lines, {
            total: 2,
            covered: 2,
            skipped: 0,
            pct: 100
        });
        assert.deepEqual(summary.functions, {
            total: 1,
            covered: 1,
            skipped: 0,
            pct: 100
        });
        assert.deepEqual(summary.branches, {
            total: 2,
            covered: 2,
            skipped: 0,
            pct: 100
        });

        assert.equal(c1.s[0], 1);
        assert.equal(c1.s[1], 1);
        assert.equal(c1.f[0], 2);
        assert.equal(c1.b[0][0], 1);
        assert.equal(c1.b[0][1], 2);
    });

    it('merges another file coverage with different starting indices', () => {
        const loc = function(sl, sc, el, ec) {
            return {
                start: { line: sl, column: sc },
                end: { line: el, column: ec }
            };
        };
        const template1 = new FileCoverage({
            path: '/path/to/file',
            statementMap: {
                0: loc(1, 1, 1, 100),
                1: loc(2, 1, 2, 50),
                2: loc(2, 51, 2, 100),
                3: loc(2, 101, 3, 100)
            },
            fnMap: {
                0: {
                    name: 'foobar',
                    line: 1,
                    loc: loc(1, 1, 1, 50)
                }
            },
            branchMap: {
                0: {
                    type: 'if',
                    line: 2,
                    locations: [loc(2, 1, 2, 20), loc(2, 50, 2, 100)]
                }
            },
            s: {
                0: 0,
                1: 0,
                2: 0,
                3: 0
            },
            f: {
                0: 0
            },
            b: {
                0: [0, 0]
            }
        });
        const template2 = new FileCoverage({
            path: '/path/to/file',
            statementMap: {
                1: loc(1, 1, 1, 100),
                2: loc(2, 1, 2, 50),
                3: loc(2, 51, 2, 100),
                4: loc(2, 101, 3, 100)
            },
            fnMap: {
                1: {
                    name: 'foobar',
                    line: 1,
                    loc: loc(1, 1, 1, 50)
                }
            },
            branchMap: {
                1: {
                    type: 'if',
                    line: 2,
                    locations: [loc(2, 1, 2, 20), loc(2, 50, 2, 100)]
                }
            },
            s: {
                1: 0,
                2: 0,
                3: 0,
                4: 0
            },
            f: {
                1: 0
            },
            b: {
                1: [0, 0]
            }
        });
        const clone = function(obj) {
            return JSON.parse(JSON.stringify(obj));
        };
        const c1 = new FileCoverage(clone(template1));
        const c2 = new FileCoverage(clone(template2));
        let summary;

        c1.s[0] = 1;
        c1.f[0] = 1;
        c1.b[0][0] = 1;

        c2.s[2] = 1;
        c2.f[1] = 1;
        c2.b[1][1] = 2;
        summary = c1.toSummary();
        assert.ok(summary instanceof CoverageSummary);
        assert.deepEqual(summary.statements, {
            total: 4,
            covered: 1,
            skipped: 0,
            pct: 25
        });
        assert.deepEqual(summary.lines, {
            total: 2,
            covered: 1,
            skipped: 0,
            pct: 50
        });
        assert.deepEqual(summary.functions, {
            total: 1,
            covered: 1,
            skipped: 0,
            pct: 100
        });
        assert.deepEqual(summary.branches, {
            total: 2,
            covered: 1,
            skipped: 0,
            pct: 50
        });

        c1.merge(c2);
        summary = c1.toSummary();
        assert.deepEqual(summary.statements, {
            total: 4,
            covered: 2,
            skipped: 0,
            pct: 50
        });
        assert.deepEqual(summary.lines, {
            total: 2,
            covered: 2,
            skipped: 0,
            pct: 100
        });
        assert.deepEqual(summary.functions, {
            total: 1,
            covered: 1,
            skipped: 0,
            pct: 100
        });
        assert.deepEqual(summary.branches, {
            total: 2,
            covered: 2,
            skipped: 0,
            pct: 100
        });

        assert.equal(c1.s[0], 1);
        assert.equal(c1.s[1], 1);
        assert.equal(c1.f[0], 2);
        assert.equal(c1.b[0][0], 1);
        assert.equal(c1.b[0][1], 2);
    });

    it('drops all data during merges', () => {
        const loc = function(sl, sc, el, ec) {
            return {
                start: { line: sl, column: sc },
                end: { line: el, column: ec }
            };
        };
        const template = new FileCoverage({
            path: '/path/to/file',
            statementMap: {
                1: loc(1, 1, 1, 100),
                2: loc(2, 1, 2, 50),
                3: loc(2, 51, 2, 100),
                4: loc(2, 101, 3, 100)
            },
            fnMap: {
                1: {
                    name: 'foobar',
                    line: 1,
                    loc: loc(1, 1, 1, 50)
                }
            },
            branchMap: {
                1: {
                    type: 'if',
                    line: 2,
                    locations: [loc(2, 1, 2, 20), loc(2, 50, 2, 100)]
                }
            },
            s: {
                1: 0,
                2: 0,
                3: 0,
                4: 0
            },
            f: {
                1: 0
            },
            b: {
                1: [0, 0]
            }
        });
        const clone = function(obj) {
            return JSON.parse(JSON.stringify(obj));
        };
        const createCoverage = all => {
            const data = clone(template);
            if (all) {
                data.all = true;
            } else {
                data.s[1] = 1;
                data.f[1] = 1;
                data.b[1][0] = 1;
            }

            return new FileCoverage(data);
        };

        const expected = createCoverage().data;
        // Get non-all data regardless of merge order
        let cov = createCoverage(true);
        cov.merge(createCoverage());
        assert.deepEqual(cov.data, expected);
        cov = createCoverage();
        cov.merge(createCoverage(true));
        assert.deepEqual(cov.data, expected);
    });

    it('merges another file coverage that tracks logical truthiness', () => {
        const loc = function(sl, sc, el, ec) {
            return {
                start: { line: sl, column: sc },
                end: { line: el, column: ec }
            };
        };
        const template = new FileCoverage({
            path: '/path/to/file',
            statementMap: {
                0: loc(1, 1, 1, 100),
                1: loc(2, 1, 2, 50),
                2: loc(2, 51, 2, 100),
                3: loc(2, 101, 3, 100)
            },
            fnMap: {
                0: {
                    name: 'foobar',
                    line: 1,
                    loc: loc(1, 1, 1, 50)
                }
            },
            branchMap: {
                0: {
                    type: 'if',
                    line: 2,
                    locations: [loc(2, 1, 2, 20), loc(2, 50, 2, 100)]
                }
            },
            s: {
                0: 0,
                1: 0,
                2: 0,
                3: 0
            },
            f: {
                0: 0
            },
            b: {
                0: [0, 0]
            },
            bT: {
                0: [0, 0]
            }
        });
        const clone = function(obj) {
            return JSON.parse(JSON.stringify(obj));
        };
        const c1 = new FileCoverage(clone(template));
        const c2 = new FileCoverage(clone(template));
        let summary;

        c1.s[0] = 1;
        c1.f[0] = 1;
        c1.b[0][0] = 1;
        c1.bT[0][0] = 1;

        c2.s[1] = 1;
        c2.f[0] = 1;
        c2.b[0][1] = 2;
        c2.bT[0][1] = 2;
        summary = c1.toSummary();
        assert.ok(summary instanceof CoverageSummary);
        assert.deepEqual(summary.statements, {
            total: 4,
            covered: 1,
            skipped: 0,
            pct: 25
        });
        assert.deepEqual(summary.lines, {
            total: 2,
            covered: 1,
            skipped: 0,
            pct: 50
        });
        assert.deepEqual(summary.functions, {
            total: 1,
            covered: 1,
            skipped: 0,
            pct: 100
        });
        assert.deepEqual(summary.branches, {
            total: 2,
            covered: 1,
            skipped: 0,
            pct: 50
        });

        c1.merge(c2);
        summary = c1.toSummary();
        assert.deepEqual(summary.statements, {
            total: 4,
            covered: 2,
            skipped: 0,
            pct: 50
        });
        assert.deepEqual(summary.lines, {
            total: 2,
            covered: 2,
            skipped: 0,
            pct: 100
        });
        assert.deepEqual(summary.functions, {
            total: 1,
            covered: 1,
            skipped: 0,
            pct: 100
        });
        assert.deepEqual(summary.branches, {
            total: 2,
            covered: 2,
            skipped: 0,
            pct: 100
        });

        assert.equal(c1.s[0], 1);
        assert.equal(c1.s[1], 1);
        assert.equal(c1.f[0], 2);
        assert.equal(c1.b[0][0], 1);
        assert.equal(c1.b[0][1], 2);
        assert.equal(c1.bT[0][0], 1);
        assert.equal(c1.bT[0][1], 2);
    });

    it('merges another file with non-overlapping branch misses', () => {
        const clone = obj => JSON.parse(JSON.stringify(obj));

        const c2data = {
            path: '/c8-merge-issue/src/index.ts',
            all: false,
            statementMap: {
                '0': {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 32 }
                },
                '1': {
                    start: { line: 2, column: 0 },
                    end: { line: 2, column: 46 }
                },
                '2': {
                    start: { line: 3, column: 0 },
                    end: { line: 3, column: 24 }
                },
                '3': {
                    start: { line: 4, column: 0 },
                    end: { line: 4, column: 36 }
                },
                '4': {
                    start: { line: 5, column: 0 },
                    end: { line: 5, column: 19 }
                },
                '5': {
                    start: { line: 6, column: 0 },
                    end: { line: 6, column: 35 }
                },
                '6': {
                    start: { line: 7, column: 0 },
                    end: { line: 7, column: 29 }
                },
                '7': {
                    start: { line: 8, column: 0 },
                    end: { line: 8, column: 28 }
                },
                '8': {
                    start: { line: 9, column: 0 },
                    end: { line: 9, column: 10 }
                },
                '9': {
                    start: { line: 10, column: 0 },
                    end: { line: 10, column: 29 }
                },
                '10': {
                    start: { line: 11, column: 0 },
                    end: { line: 11, column: 3 }
                },
                '11': {
                    start: { line: 12, column: 0 },
                    end: { line: 12, column: 34 }
                },
                '12': {
                    start: { line: 13, column: 0 },
                    end: { line: 13, column: 10 }
                },
                '13': {
                    start: { line: 14, column: 0 },
                    end: { line: 14, column: 1 }
                },
                '14': {
                    start: { line: 15, column: 0 },
                    end: { line: 15, column: 30 }
                }
            },
            s: {
                '0': 1,
                '1': 1,
                '2': 1,
                '3': 1,
                '4': 1,
                '5': 1,
                '6': 0,
                '7': 0,
                '8': 1,
                '9': 1,
                '10': 1,
                '11': 1,
                '12': 1,
                '13': 1,
                '14': 1
            },
            branchMap: {
                '0': {
                    type: 'branch',
                    line: 3,
                    loc: {
                        start: { line: 3, column: 17 },
                        end: { line: 14, column: 1 }
                    },
                    locations: [
                        {
                            start: { line: 3, column: 17 },
                            end: { line: 14, column: 1 }
                        }
                    ]
                },
                '1': {
                    type: 'branch',
                    line: 6,
                    loc: {
                        start: { line: 6, column: 34 },
                        end: { line: 9, column: 9 }
                    },
                    locations: [
                        {
                            start: { line: 6, column: 34 },
                            end: { line: 9, column: 9 }
                        }
                    ]
                }
            },
            b: { '0': [1], '1': [0] },
            fnMap: {
                '0': {
                    name: 'x',
                    decl: {
                        start: { line: 3, column: 17 },
                        end: { line: 14, column: 1 }
                    },
                    loc: {
                        start: { line: 3, column: 17 },
                        end: { line: 14, column: 1 }
                    },
                    line: 3
                }
            },
            f: { '0': 1 }
        };

        const c1data = {
            // gathered experimentally, see:
            // https://github.com/istanbuljs/v8-to-istanbul/issues/233
            path: '/c8-merge-issue/src/index.ts',
            all: false,
            statementMap: {
                '0': {
                    start: { line: 1, column: 0 },
                    end: { line: 1, column: 32 }
                },
                '1': {
                    start: { line: 2, column: 0 },
                    end: { line: 2, column: 46 }
                },
                '2': {
                    start: { line: 3, column: 0 },
                    end: { line: 3, column: 24 }
                },
                '3': {
                    start: { line: 4, column: 0 },
                    end: { line: 4, column: 36 }
                },
                '4': {
                    start: { line: 5, column: 0 },
                    end: { line: 5, column: 19 }
                },
                '5': {
                    start: { line: 6, column: 0 },
                    end: { line: 6, column: 35 }
                },
                '6': {
                    start: { line: 7, column: 0 },
                    end: { line: 7, column: 29 }
                },
                '7': {
                    start: { line: 8, column: 0 },
                    end: { line: 8, column: 28 }
                },
                '8': {
                    start: { line: 9, column: 0 },
                    end: { line: 9, column: 10 }
                },
                '9': {
                    start: { line: 10, column: 0 },
                    end: { line: 10, column: 29 }
                },
                '10': {
                    start: { line: 11, column: 0 },
                    end: { line: 11, column: 3 }
                },
                '11': {
                    start: { line: 12, column: 0 },
                    end: { line: 12, column: 34 }
                },
                '12': {
                    start: { line: 13, column: 0 },
                    end: { line: 13, column: 10 }
                },
                '13': {
                    start: { line: 14, column: 0 },
                    end: { line: 14, column: 1 }
                },
                '14': {
                    start: { line: 15, column: 0 },
                    end: { line: 15, column: 30 }
                }
            },
            s: {
                '0': 1,
                '1': 1,
                '2': 1,
                '3': 1,
                '4': 1,
                '5': 1,
                '6': 1,
                '7': 1,
                '8': 1,
                '9': 0,
                '10': 0,
                '11': 1,
                '12': 1,
                '13': 1,
                '14': 1
            },
            branchMap: {
                '0': {
                    type: 'branch',
                    line: 3,
                    loc: {
                        start: { line: 3, column: 17 },
                        end: { line: 14, column: 1 }
                    },
                    locations: [
                        {
                            start: { line: 3, column: 17 },
                            end: { line: 14, column: 1 }
                        }
                    ]
                },
                '1': {
                    type: 'branch',
                    line: 9,
                    loc: {
                        start: { line: 9, column: 3 },
                        end: { line: 11, column: 3 }
                    },
                    locations: [
                        {
                            start: { line: 9, column: 3 },
                            end: { line: 11, column: 3 }
                        }
                    ]
                }
            },
            b: { '0': [1], '1': [0] },
            fnMap: {
                '0': {
                    name: 'x',
                    decl: {
                        start: { line: 3, column: 17 },
                        end: { line: 14, column: 1 }
                    },
                    loc: {
                        start: { line: 3, column: 17 },
                        end: { line: 14, column: 1 }
                    },
                    line: 3
                }
            },
            f: { '0': 1 }
        };

        const c1 = new FileCoverage(clone(c1data));
        const c2 = new FileCoverage(clone(c2data));

        c1.merge(c2);
        c1.merge(new FileCoverage(clone(c1data)));
        c1.merge(new FileCoverage(clone(c2data)));
        assert.deepEqual(c1.toSummary().data, {
            lines: { total: 15, covered: 15, skipped: 0, pct: 100 },
            functions: { total: 1, covered: 1, skipped: 0, pct: 100 },
            statements: { total: 15, covered: 15, skipped: 0, pct: 100 },
            branches: { total: 3, covered: 3, skipped: 0, pct: 100 }
        });
    });

    it('resets hits when requested', () => {
        const loc = function(sl, sc, el, ec) {
            return {
                start: { line: sl, column: sc },
                end: { line: el, column: ec }
            };
        };
        const fc = new FileCoverage({
            path: '/path/to/file',
            statementMap: {
                1: loc(1, 1, 1, 100),
                2: loc(2, 1, 2, 50),
                3: loc(2, 51, 2, 100),
                4: loc(2, 101, 3, 100)
            },
            fnMap: {
                1: {
                    name: 'foobar',
                    line: 1,
                    loc: loc(1, 1, 1, 50)
                }
            },
            branchMap: {
                1: {
                    type: 'if',
                    line: 2,
                    locations: [loc(2, 1, 2, 20), loc(2, 50, 2, 100)]
                }
            },
            s: {
                1: 2,
                2: 3,
                3: 1,
                4: 0
            },
            f: {
                1: 54
            },
            b: {
                1: [1, 50]
            },
            bT: {
                1: [1, 50]
            }
        });
        fc.resetHits();
        assert.deepEqual({ 1: 0, 2: 0, 3: 0, 4: 0 }, fc.s);
        assert.deepEqual({ 1: 0 }, fc.f);
        assert.deepEqual({ 1: [0, 0] }, fc.b);
        assert.deepEqual({ 1: [0, 0] }, fc.bT);
        // does not throw if bT missing
        fc.data.bT = undefined;
        fc.resetHits();
        assert.equal(fc.bT, undefined);
    });

    it('returns uncovered lines', () => {
        const c = new FileCoverage({
            path: '/path/to/file',
            statementMap: {
                1: {
                    start: { line: 1, column: 1 },
                    end: { line: 1, column: 100 }
                },
                2: {
                    start: { line: 1, column: 101 },
                    end: { line: 1, column: 200 }
                },
                3: {
                    start: { line: 2, column: 1 },
                    end: { line: 2, column: 100 }
                }
            },
            fnMap: {},
            branchMap: {},
            s: { 1: 0, 2: 1, 3: 0 },
            b: {},
            f: {}
        });
        assert.deepEqual(['2'], c.getUncoveredLines());
    });

    it('returns branch coverage by line', () => {
        const c = new FileCoverage({
            path: '/path/to/file',
            branchMap: {
                1: { line: 1 },
                2: { line: 2 }
            },
            fnMap: {},
            statementMap: {},
            s: {},
            b: {
                1: [1, 0],
                2: [0, 0, 0, 1]
            },
            f: {}
        });
        const bcby = c.getBranchCoverageByLine();
        assert.deepEqual(
            {
                1: {
                    covered: 1,
                    total: 2,
                    coverage: 50
                },
                2: {
                    covered: 1,
                    total: 4,
                    coverage: 25
                }
            },
            bcby
        );
    });

    it('returns branch coverage by line with Cobertura branchMap structure', () => {
        const loc = function(sl, sc, el, ec) {
            return {
                start: { line: sl, column: sc },
                end: { line: el, column: ec }
            };
        };
        const c = new FileCoverage({
            path: '/path/to/file',
            branchMap: {
                1: { loc: loc(1, 1, 1, 100) },
                2: { loc: loc(2, 50, 2, 100) }
            },
            fnMap: {},
            statementMap: {},
            s: {},
            b: {
                1: [1, 0],
                2: [0, 0, 0, 1]
            },
            f: {}
        });
        const bcby = c.getBranchCoverageByLine();
        assert.deepEqual(
            {
                1: {
                    covered: 1,
                    total: 2,
                    coverage: 50
                },
                2: {
                    covered: 1,
                    total: 4,
                    coverage: 25
                }
            },
            bcby
        );
    });

    it('allows file coverage to be initialized with tracking for logical truthiness', () => {
        let fcov = new FileCoverage('foo.json');
        assert.notOk(fcov.data.bT);
        fcov = new FileCoverage('foo.json', true);
        assert.ok(fcov.data.bT);
        assert.ok(fcov.toSummary().branchesTrue);
    });
});

describe('addHits unit coverage', () => {
    it('adds numbers', () => assert.equal(addHits(1, 2), 3));
    it('adds arrays', () => assert.deepEqual(addHits([1, 2], [2, 3]), [3, 5]));
    it('nulls invalid input', () => assert.equal(addHits(1, [2]), null));
});

describe('findNearestContainer unit coverage', () => {
    it('finds the nearest containing range', () => {
        const loc = (sl, sc, el, ec) => ({
            loc: {
                start: { line: sl, column: sc },
                end: { line: el, column: ec }
            }
        });
        const item1 = loc(5, 5, 10, 10);
        const item2 = loc(9, 0, 10, 10);
        const map = {
            0: loc(1, 1, 100, 100),
            1: loc(2, 2, 90, 0),
            3: loc(5, 0, 11, 0),
            4: loc(5, 1, 10, 99),
            5: loc(5, 10, 10, 10),
            6: loc(6, 0, 10, 10),
            // does not happen in practice, but verify that the code
            // will behave properly if ranges are out of order.
            7: loc(2, 3, 90, 0)
        };
        assert.equal(findNearestContainer(item1, map), '4');
        assert.equal(findNearestContainer(item2, map), '6');
    });
});

describe('addNearestContainerHits unit coverage', () => {
    it('adds hits from the nearest container', () => {
        const loc = (sl, sc, el, ec) => ({
            loc: {
                start: { line: sl, column: sc },
                end: { line: el, column: ec }
            }
        });
        const item = loc(5, 5, 10, 10);
        const map = {
            0: loc(1, 1, 100, 100),
            1: loc(2, 2, 90, 0),
            3: loc(5, 0, 11, 0),
            4: loc(5, 1, 10, 99),
            5: loc(5, 10, 10, 10),
            6: loc(6, 0, 10, 10)
        };
        const hits = {
            0: 0,
            1: 1,
            2: 2,
            3: 3,
            4: 4,
            5: 5,
            6: 6
        };
        assert.equal(addNearestContainerHits(item, 10, map, hits), 14);
        assert.equal(
            addNearestContainerHits(loc(1000, 4, 10010, 1234), 10, map, hits),
            10
        );
    });
});

describe('findNearestContainer missing loc defense', () => {
    it('does not throw if loc is missing', () => {
        const loc = (sl, sc, el, ec) => ({
            start: { line: sl, column: sc },
            end: { line: el, column: ec }
        });
        const map = {
            0: { loc: loc(1, 1, 100, 100) },
            1: {},
            2: loc(10, 10, 50, 50),
            3: { loc: loc(20, 20, 40, 40) }
        };
        assert.equal(findNearestContainer({ no: 'loc' }, map), null);
        assert.equal(findNearestContainer(loc(30, 30, 35, 35), '3'));
    });
});
