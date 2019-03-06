/* globals describe, it */

var assert = require('chai').assert;
var CoverageSummary = require('../lib/file').CoverageSummary;
var CoverageMap = require('../lib/coverage-map').CoverageMap;
var index = require('../index');

describe('external interface', () => {
    it('exports the FileCoverage constructor', () => {
        assert.isFunction(index.classes.FileCoverage);
    });
    it('allows coverage summary creation', () => {
        var fc = index.createCoverageSummary();
        var fc2;
        assert.ok(fc instanceof CoverageSummary);
        fc2 = index.createCoverageSummary(fc);
        assert.ok(fc2 === fc);
    });
    it('allows coverage map creation', () => {
        var fc = index.createCoverageMap();
        var fc2;
        assert.ok(fc instanceof CoverageMap);
        fc2 = index.createCoverageMap(fc);
        assert.ok(fc2 === fc);
    });
    it('allows file coverage creation', () => {
        var fc = index.createFileCoverage('/path/to/foo.js');
        var fc2;
        assert.ok(fc instanceof index.classes.FileCoverage);
        fc2 = index.createFileCoverage(fc);
        assert.ok(fc2 === fc);
    });
});
