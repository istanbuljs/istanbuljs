/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
"use strict";
/**
 * WIP
 * @param coverageMap
 * @param opts
 * @constructor
 */
function ReportSource(coverageMap, opts) {
    this.map = coverageMap;
    this.opts = opts || {};
}

ReportSource.prototype.getFinalCoverage = function () {
    return this.map;
};

ReportSource.prototype.writeReports = function (reports, context) {
    var opts = this.opts,
        tree,
        summarizer = opts.summarizer || require('./summarizer').createPackageSummary;

    if (!Array.isArray(reports)) {
        reports = [ reports ];
    }
    tree = summarizer(this.map);
    reports.forEach(function (report) {
        tree.visit(report, context);
    });
};

module.exports = {
    create: function (map, opts) {
        return new ReportSource(map, opts);
    }
};


