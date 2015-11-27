/* globals describe, it */

var assert = require('chai').assert,
    SourceCoverage = require('../lib/source-coverage');

describe('file coverage', function () {
    it('allows a path constructor, has all properties', function () {
        var fc = new SourceCoverage('/path/to/file');
        assert.ok(fc.statementMap);
        assert.ok(fc.fnMap);
        assert.ok(fc.branchMap);
        assert.ok(fc.s);
        assert.ok(fc.f);
        assert.ok(fc.b);
        assert.ok(fc.getLineCoverage());
    });

    it('allows another object as constructor', function () {
        var fc = new SourceCoverage('/path/to/file'),
            fc2 = null,
            fc3 = null;

        assert.doesNotThrow(function () {
            fc2 = new SourceCoverage(fc);
        });
        assert.doesNotThrow(function () {
            fc3 = new SourceCoverage(fc.data);
        });
        assert.ok(fc2.statementMap);
        assert.ok(fc3.statementMap);
    });

    it('allows building object incrementally, produces summary coverage', function () {
        var fc = new SourceCoverage('/path/to/file'),
            loc = function (sl, sc, el, ec) {
              return {
                  start: { line: sl, column: sc },
                  end: { line: el, column: ec }
              };
            },
            locCount = 0,
            fixer = function () {
                locCount += 1;
            },
            index,
            index2,
            sc,
            fc2;

        index = fc.newStatement(loc(1, 0, 1, 100));
        assert.ok(index);
        assert.deepEqual(fc.statementMap[index], loc(1, 0, 1, 100));
        index2 = fc.newStatement(loc(2, 0, 2, 30));
        assert.ok(index2 > index);
        fc.s[index] = 20;

        index = fc.newFunction('foo', loc(1, 0, 1, 20), loc(1, 0, 1, 100));
        assert.ok(index);
        assert.deepEqual(fc.fnMap[index].loc, loc(1, 0, 1, 20));
        assert.deepEqual(fc.fnMap[index].span, loc(1, 0, 1, 100));

        index = fc.newFunction(undefined, loc(1, 0, 1, 60), loc(1, 0, 1, 80));
        assert.ok(index);
        assert.equal(fc.fnMap[index].name,'(anonymous_' + index + ')');

        index = fc.newBranch('if', loc(1, 15, 1, 20));
        assert.ok(index);
        assert.equal(fc.branchMap[index].line, 1);
        fc.addBranchPath(index, loc(1, 15, 1, 20));
        fc.addBranchPath(index, loc(1, 21, 1, 40));
        assert.deepEqual(fc.branchMap[index].locations[0], loc(1, 15, 1, 20));
        assert.deepEqual(fc.branchMap[index].locations[1], loc(1, 21, 1, 40));
        fc.b[index][0] = 1;
        // does not allow branch path for invalid branch
        assert.throws(function () {
           fc.addBranchPath(100, loc(1,15,1,20));
        });

        index2 = fc.newBranch('cond-expr', loc(1, 41, 1, 50));
        assert.ok(index2 > index);
        assert.ok(fc.branchMap[index2]);

        fc.adjustLocations(fixer);
        assert.equal(locCount, 6);
        fc.freeze();
        assert.ok(!fc.branchMap[index2]);

        sc = fc.toSummary();
        assert.equal(50, sc.statements.pct);
        assert.equal(0, sc.functions.pct);
        assert.equal(50, sc.branches.pct);
        assert.equal(50, sc.lines.pct);

        fc2 = new SourceCoverage(fc);
        fc2.s[1] = 1;
        fc2.s[2] = 2;
        fc2.b[1][1] = 1;
        fc2.f[1] = 1;
        fc.merge(fc2);

        sc = fc.toSummary();
        assert.equal(100, sc.statements.pct);
        assert.equal(50, sc.functions.pct);
        assert.equal(100, sc.branches.pct);
        assert.equal(100, sc.lines.pct);
    });

    it('provides max line hits for statement on a line', function () {
        var c = new SourceCoverage('/path/to/file'),
            loc = function (sl, sc, el, ec) {
                return {
                    start: { line: sl, column: sc },
                    end: { line: el, column: ec }
                };
            };

        c.newStatement(loc(1,1,1,40));
        c.newStatement(loc(1,1,41,80));
        c.s[1] = 200;
        c.s[2] = 100;
        assert.equal(200, c.getLineCoverage()[1]);
    });
});
