'use strict';
/* globals describe, it */

const assert = require('chai').assert;
const { CoverageSummary } = require('../lib/coverage-summary');
const { CoverageMap } = require('../lib/coverage-map');
const index = require('../index');

describe('external interface', () => {
    it('exports the FileCoverage constructor', () => {
        assert.isFunction(index.classes.FileCoverage);
    });
    it('allows coverage summary creation', () => {
        const fc = index.createCoverageSummary();
        assert.ok(fc instanceof CoverageSummary);

        const fc2 = index.createCoverageSummary(fc);
        assert.ok(fc2 === fc);
    });
    it('allows coverage map creation', () => {
        const fc = index.createCoverageMap();
        assert.ok(fc instanceof CoverageMap);

        const fc2 = index.createCoverageMap(fc);
        assert.ok(fc2 === fc);
    });
    it('allows file coverage creation', () => {
        const fc = index.createFileCoverage('/path/to/foo.js');
        assert.ok(fc instanceof index.classes.FileCoverage);

        const fc2 = index.createFileCoverage(fc);
        assert.ok(fc2 === fc);
    });
});
