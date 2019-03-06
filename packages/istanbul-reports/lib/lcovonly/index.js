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
    var fc = node.getFileCoverage();
    var writer = this.contentWriter;
    var functions = fc.f;
    var functionMap = fc.fnMap;
    var lines = fc.getLineCoverage();
    var branches = fc.b;
    var branchMap = fc.branchMap;
    var summary = node.getCoverageSummary();

    writer.println('TN:'); //no test name
    writer.println('SF:' + fc.path);

    Object.keys(functionMap).forEach(key => {
        var meta = functionMap[key];
        writer.println('FN:' + [meta.decl.start.line, meta.name].join(','));
    });
    writer.println('FNF:' + summary.functions.total);
    writer.println('FNH:' + summary.functions.covered);

    Object.keys(functionMap).forEach(key => {
        var stats = functions[key];
        var meta = functionMap[key];
        writer.println('FNDA:' + [stats, meta.name].join(','));
    });

    Object.keys(lines).forEach(key => {
        var stat = lines[key];
        writer.println('DA:' + [key, stat].join(','));
    });
    writer.println('LF:' + summary.lines.total);
    writer.println('LH:' + summary.lines.covered);

    Object.keys(branches).forEach(key => {
        var branchArray = branches[key];
        var meta = branchMap[key];
        var line = meta.loc.start.line;
        var i = 0;
        branchArray.forEach(b => {
            writer.println('BRDA:' + [line, key, i, b].join(','));
            i += 1;
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
