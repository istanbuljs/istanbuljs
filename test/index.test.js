/* globals describe, it */

var assert = require('chai').assert,
    CoverageSummary = require('../lib/file').CoverageSummary,
    CoverageMap = require('../lib/coverage-map').CoverageMap,
    index = require('../index');

describe('external interface', function () {
    it('exports the FileCoverage constructor', function () {
        assert.isFunction(index.classes.FileCoverage);
    });
    it('allows coverage summary creation', function () {
        var fc = index.createCoverageSummary(),
            fc2;
        assert.ok(fc instanceof CoverageSummary);
        fc2 = index.createCoverageSummary(fc);
        assert.ok(fc2 === fc);
    });
    it('allows coverage map creation', function () {
        var fc = index.createCoverageMap(),
            fc2;
        assert.ok(fc instanceof CoverageMap);
        fc2 = index.createCoverageMap(fc);
        assert.ok(fc2 === fc);
    });
    it('allows file coverage creation', function () {
        var fc = index.createFileCoverage('/path/to/foo.js'),
            fc2;
        assert.ok(fc instanceof index.classes.FileCoverage);
        fc2 = index.createFileCoverage(fc);
        assert.ok(fc2 === fc);
    });
});
