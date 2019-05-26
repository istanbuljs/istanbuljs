/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

function LcovOnlyReport(opts) {
    this.file = opts.file || 'lcov.info';
    this.contentWriter = null;
}

LcovOnlyReport.prototype.onStart = function(root, context) {
    this.contentWriter = context.writer.writeFile(this.file);
};

LcovOnlyReport.prototype.onDetail = function(node) {
    const fc = node.getFileCoverage();
    const writer = this.contentWriter;
    const functions = fc.f;
    const functionMap = fc.fnMap;
    const lines = fc.getLineCoverage();
    const branches = fc.b;
    const branchMap = fc.branchMap;
    const summary = node.getCoverageSummary();

    writer.println('TN:'); //no test name
    writer.println('SF:' + fc.path);

    Object.values(functionMap).forEach(meta => {
        writer.println('FN:' + [meta.decl.start.line, meta.name].join(','));
    });
    writer.println('FNF:' + summary.functions.total);
    writer.println('FNH:' + summary.functions.covered);

    Object.entries(functionMap).forEach(([key, meta]) => {
        const stats = functions[key];
        writer.println('FNDA:' + [stats, meta.name].join(','));
    });

    Object.entries(lines).forEach(entry => {
        writer.println('DA:' + entry.join(','));
    });
    writer.println('LF:' + summary.lines.total);
    writer.println('LH:' + summary.lines.covered);

    Object.entries(branches).forEach(([key, branchArray]) => {
        const meta = branchMap[key];
        const { line } = meta.loc.start;
        branchArray.forEach((b, i) => {
            writer.println('BRDA:' + [line, key, i, b].join(','));
        });
    });
    writer.println('BRF:' + summary.branches.total);
    writer.println('BRH:' + summary.branches.covered);
    writer.println('end_of_record');
};

LcovOnlyReport.prototype.onEnd = function() {
    this.contentWriter.close();
};

module.exports = LcovOnlyReport;
