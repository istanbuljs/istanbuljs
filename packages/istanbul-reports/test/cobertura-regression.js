/* globals it */
const FileWriter = require('istanbul-lib-report/lib/file-writer');
const istanbulLibReport = require('istanbul-lib-report');
const istanbulLibCoverage = require('istanbul-lib-coverage');
const Report = require('../lib/cobertura');

it('issue 384', () => {
    const coverageMap = istanbulLibCoverage.createCoverageMap({});
    const tree = istanbulLibReport.summarizers.pkg(coverageMap);
    const context = istanbulLibReport.createContext({
        dir: './'
    });
    const report = new Report({ file: '-' });

    FileWriter.startCapture();
    tree.visit(report, context);
    FileWriter.stopCapture();
});
