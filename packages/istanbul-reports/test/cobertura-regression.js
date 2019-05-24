'use strict';
/* globals it */
const FileWriter = require('istanbul-lib-report/lib/file-writer');
const istanbulLibReport = require('istanbul-lib-report');
const istanbulLibCoverage = require('istanbul-lib-coverage');
const Report = require('../lib/cobertura');

it('issue 384', () => {
    const context = istanbulLibReport.createContext({
        dir: './',
        coverageMap: istanbulLibCoverage.createCoverageMap({})
    });
    const tree = context.getTree('pkg');
    const report = new Report({ file: '-' });

    FileWriter.startCapture();
    tree.visit(report, context);
    FileWriter.stopCapture();
});
