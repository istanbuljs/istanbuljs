/* globals describe, it */
var assert = require('chai').assert,
    MappedCoverage = require('../lib/mapped').MappedCoverage;

describe('mapped coverage', function () {
    it('allows a path constructor, has all properties', function () {
        var fc = new MappedCoverage('/path/to/file');
        assert.ok(fc.statementMap);
        assert.ok(fc.fnMap);
        assert.ok(fc.branchMap);
        assert.ok(fc.s);
        assert.ok(fc.f);
        assert.ok(fc.b);
        assert.ok(fc.getLineCoverage());
    });

    it('allows building object incrementally, resolving dups', function () {
        var mc = new MappedCoverage('/path/to/file'),
            loc = function (sl, sc, el, ec) {
                return {
                    start: { line: sl, column: sc },
                    end: { line: el, column: ec }
                };
            },
            index,
            index2,
            sc;

        index = mc.addStatement(loc(1, 0, 1, 100), 1);
        assert.strictEqual(index, 0);
        assert.deepEqual(mc.statementMap[index], loc(1, 0, 1, 100));

        index2 = mc.addStatement(loc(1, 0, 1, 100), 1);
        assert.equal(index, index2);

        index2 = mc.addStatement(loc(2, 0, 2, 30), 0);
        assert.ok(index2 > index);
        mc.s[index] = 20;

        index = mc.addFunction('foo', loc(1, 0, 1, 20), loc(1, 0, 1, 100), 0);
        assert.strictEqual(index, 0);
        assert.deepEqual(mc.fnMap[index].decl, loc(1, 0, 1, 20));
        assert.deepEqual(mc.fnMap[index].loc, loc(1, 0, 1, 100));

        index2 = mc.addFunction('bar', loc(1, 0, 1, 20), loc(1, 0, 1, 100), 1);
        assert.equal(index, index2);
        assert.equal(mc.fnMap[index].name, 'foo');

        index = mc.addFunction(undefined, loc(1, 0, 1, 60), loc(1, 0, 1, 80), 0);
        assert.ok(index);
        assert.equal(mc.fnMap[index].name,'(unknown_' + index + ')');

        index = mc.addBranch('if', loc(1, 15, 1, 20), [loc(1, 15, 1, 20), loc(1, 21, 1, 40)], [1,0]);
        assert.strictEqual(index, 0);
        assert.deepEqual(mc.branchMap[index].loc, loc(1, 15, 1, 20));
        assert.deepEqual(mc.branchMap[index].locations[0], loc(1, 15, 1, 20));
        assert.deepEqual(mc.branchMap[index].locations[1], loc(1, 21, 1, 40));

        index2 = mc.addBranch('if', loc(1, 15, 1, 20), [loc(1, 15, 1, 20), loc(1, 21, 1, 40)], [0,1]);
        assert.equal(index, index2);

        sc = mc.toSummary();
        assert.equal(50, sc.statements.pct);
        assert.equal(50, sc.functions.pct);
        assert.equal(100, sc.branches.pct);
        assert.equal(50, sc.lines.pct);
    });
});
