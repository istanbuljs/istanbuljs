/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
"use strict";

/**
 * @module AllExports
 */

var CoverageSummary = require('./lib/file').CoverageSummary,
    FileCoverage = require('./lib/file').FileCoverage,
    CoverageMap = require('./lib/coverage-map').CoverageMap;

module.exports = {
    /**
     * creates a coverage summary object
     * @param {Object} obj an argument with the same semantics
     *  as the one passed to the `CoverageSummary` constructor
     * @returns {CoverageSummary}
     */
    createCoverageSummary: function (obj) {
        if (obj && obj instanceof CoverageSummary) {
            return obj;
        }
        return new CoverageSummary(obj);
    },
    /**
     * creates a CoverageMap object
     * @param {Object} obj optional - an argument with the same semantics
     *  as the one passed to the CoverageMap constructor.
     * @returns {CoverageMap}
     */
    createCoverageMap: function (obj) {
        if (obj && obj instanceof CoverageMap) {
            return obj;
        }
        return new CoverageMap(obj);
    }
};

/** classes exported for reuse */
module.exports.classes = {
    /**
     * the file coverage constructor
     */
    FileCoverage: FileCoverage
};
