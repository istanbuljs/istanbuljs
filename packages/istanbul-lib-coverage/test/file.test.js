/* globals describe, it */

var assert = require('chai').assert,
    base = require('../lib/file'),
    CoverageSummary = base.CoverageSummary,
    FileCoverage = base.FileCoverage;

describe('coverage summary', function () {
    it('allows a noop constructor', function () {
        var cs = new CoverageSummary();
        assert.ok(cs.statements);
        assert.ok(cs.lines);
        assert.ok(cs.functions);
        assert.ok(cs.branches);
    });

    it('allows another summary in constructor', function () {
        var cs1 = new CoverageSummary(),
            cs2;
        assert.doesNotThrow(function () {
            cs2 = new CoverageSummary(cs1);
        });
    });

    it('allows summary data in constructor', function () {
        var cs1 = new CoverageSummary(),
            cs2;
        assert.doesNotThrow(function () {
            cs2 = new CoverageSummary(cs1.data);
        });
    });

    it('can be initialized with non-zero totals', function () {
        var cs = new CoverageSummary().data,
            cs2;
        cs.statements.total = 5;
        cs.statements.covered = 4;
        cs.statements.skipped = 0;
        cs.statements.pct = 80;
        cs2 = new CoverageSummary(cs);
        assert.deepEqual(cs2.statements, {
            total: 5,
            covered: 4,
            skipped: 0,
            pct: 80
        });
    });

    it('cannot be initialized with an object with missing keys', function () {
        assert.throws(function () {
            /*jshint nonew: false */
            new CoverageSummary({statements: {}});
        });
    });

    it('merges summaries correctly', function () {
        var basic = function () {
                return {
                    total: 5,
                    covered: 4,
                    skipped: 0,
                    pct: 80
                };
            },
            empty = function () {
                return {
                    total: 0,
                    covered: 0,
                    skipped: 0,
                    pct: 100
                };
            },
            cs1 = new CoverageSummary({
                statements: basic(),
                functions: basic(),
                lines: basic(),
                branches: empty()
            }),
            cs2 = new CoverageSummary({
                statements: basic(),
                functions: basic(),
                lines: basic(),
                branches: empty()
            }),
            data;
        cs2.statements.covered = 5;
        cs1.merge(cs2);
        assert.deepEqual(cs1.statements, {
            total: 10,
            covered: 9,
            skipped: 0,
            pct: 90
        });
        assert.equal(cs1.branches.pct, 100);
        data = JSON.parse(JSON.stringify(cs1));
        assert.deepEqual(data.statements, {
            total: 10,
            covered: 9,
            skipped: 0,
            pct: 90
        });
        assert.equal(data.branches.pct, 100);
    });
});

describe('base coverage', function () {

    it('does not allow a noop/ invalid constructor', function () {
        assert.throws(function () {
            /* jshint nonew: false */
            new FileCoverage();
        });
        assert.throws(function () {
            /* jshint nonew: false */
            new FileCoverage(10);
        });
    });

    it('allows a path in constructor', function () {
        var bc = null;
        assert.doesNotThrow(function () {
            bc = new FileCoverage("/path/to/file");
        });
        assert.ok(bc.statementMap);
        assert.ok(bc.fnMap);
        assert.ok(bc.branchMap);
        assert.ok(bc.s);
        assert.ok(bc.f);
        assert.ok(bc.b);
        assert.ok(bc.getLineCoverage());
        assert.equal(bc.path, "/path/to/file");
    });

    it('allows another object in constructor, produces JSON', function () {
        var bc1 = new FileCoverage('/path/to/file'),
            bc2,
            bc3;

        bc2 = new FileCoverage(bc1);
        assert.equal(bc2.path, '/path/to/file');
        bc3 = new FileCoverage(bc1.data);
        assert.equal(bc3.path, '/path/to/file');
        assert.deepEqual(bc1.data, JSON.parse(JSON.stringify(bc3)));

        delete bc3.data.s;
        assert.throws(function () {
            /* jshint nonew: false */
            new FileCoverage(bc3.data);
        });
    });

    it('merges another file coverage correctly', function () {
        var loc = function (sl, sc, el, ec) {
                return {
                    start: {line: sl, column: sc},
                    end: {line: el, column: ec}
                };
            },
            template = new FileCoverage({
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
                        locations: [ loc(2,1,2,20), loc(2,50, 2, 100) ]
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
                    1: [ 0, 0 ]
                }
            }),
            clone = function (obj) { return JSON.parse(JSON.stringify(obj));},
            c1 = new FileCoverage(clone(template)),
            c2 = new FileCoverage(clone(template)),
            summary;

        c1.s[1] = 1;
        c1.f[1] = 1;
        c1.b[1][0] = 1;

        c2.s[2] = 1;
        c2.f[1] = 1;
        c2.b[1][1] = 2;
        summary = c1.toSummary();
        assert.ok(summary instanceof CoverageSummary);
        assert.deepEqual(summary.statements, { total: 4, covered: 1, skipped: 0, pct: 25 });
        assert.deepEqual(summary.lines, { total: 2, covered: 1, skipped: 0, pct: 50 });
        assert.deepEqual(summary.functions, { total: 1, covered: 1, skipped: 0, pct: 100 });
        assert.deepEqual(summary.branches, { total: 2, covered: 1, skipped: 0, pct: 50 });

        c1.merge(c2);
        summary = c1.toSummary();
        assert.deepEqual(summary.statements, { total: 4, covered: 2, skipped: 0, pct: 50 });
        assert.deepEqual(summary.lines, { total: 2, covered: 2, skipped: 0, pct: 100 });
        assert.deepEqual(summary.functions, { total: 1, covered: 1, skipped: 0, pct: 100 });
        assert.deepEqual(summary.branches, { total: 2, covered: 2, skipped: 0, pct: 100 });

        assert.equal(c1.s[1], 1);
        assert.equal(c1.s[2], 1);
        assert.equal(c1.f[1], 2);
        assert.equal(c1.b[1][0], 1);
        assert.equal(c1.b[1][1], 2);
    });

    it('resets hits when requested', function () {
        var loc = function (sl, sc, el, ec) {
                return {
                    start: {line: sl, column: sc},
                    end: {line: el, column: ec}
                };
            },
            fc = new FileCoverage({
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
                        locations: [ loc(2,1,2,20), loc(2,50, 2, 100) ]
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
                    1: [ 1, 50 ]
                }
            });
        fc.resetHits();
        assert.deepEqual({1:0, 2:0, 3:0, 4:0}, fc.s);
        assert.deepEqual({1:0}, fc.f);
        assert.deepEqual({1: [0,0]}, fc.b);
    });

    it('returns uncovered lines', function () {
        var c = new FileCoverage({
            path: '/path/to/file',
            statementMap: {
                1: {start: {line: 1, column: 1}, end: {line: 1, column: 100}},
                2: {start: {line: 1, column: 101}, end: {line: 1, column: 200}},
                3: {start: {line: 2, column: 1}, end: {line: 2, column: 100}}
            },
            fnMap: {},
            branchMap: {},
            s: {1: 0, 2: 1, 3: 0},
            b: {},
            f: {}
        });
        assert.deepEqual(['2'], c.getUncoveredLines());
    });

    it('returns branch coverage by line', function () {
        var c = new FileCoverage({
                path: '/path/to/file',
                branchMap: {
                    1: {line: 1},
                    2: {line: 2}
                },
                fnMap: {},
                statementMap: {},
                s: {},
                b: {
                    1: [1, 0],
                    2: [0, 0, 0, 1]
                },
                f: {}
            }),
            bcby = c.getBranchCoverageByLine();
        assert.deepEqual({
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
        }, bcby);
    });
});
