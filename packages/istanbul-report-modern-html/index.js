/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
const Report = require('./lib');
const libReport = require('istanbul-lib-report');

module.exports = reportOptions => {
    const report = new Report(reportOptions);
    return (coverageMap, context) => {
        const nestedSummarizer = libReport.summarizers.nested;
        const packageSummarizer = libReport.summarizers.pkg;
        const tree = packageSummarizer(coverageMap);
        tree.visit(report, context);
        const nestedTree = nestedSummarizer(coverageMap);
        report.writeSummary(nestedTree.getRoot(), tree.getRoot(), context);
    };
};
