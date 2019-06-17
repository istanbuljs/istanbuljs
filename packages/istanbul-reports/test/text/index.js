'use strict';
/* globals describe, it, beforeEach, before, after */
const fs = require('fs');
const path = require('path');
const isWindows = require('is-windows');
const FileWriter = require('istanbul-lib-report/lib/file-writer');
const istanbulLibReport = require('istanbul-lib-report');
const istanbulLibCoverage = require('istanbul-lib-coverage');
const TextReport = require('../../lib/text/index');

require('chai').should();

describe('TextReport', () => {
    before(() => {
        FileWriter.startCapture();
    });
    after(() => {
        FileWriter.stopCapture();
    });
    beforeEach(() => {
        FileWriter.resetOutput();
    });

    function createTest(file) {
        const fixture = require(path.resolve(
            __dirname,
            '../fixtures/specs/' + file
        ));
        it(fixture.title, function() {
            if (isWindows()) {
                // appveyor does not render console color.
                return this.skip();
            }
            const context = istanbulLibReport.createContext({
                dir: './',
                coverageMap: istanbulLibCoverage.createCoverageMap(fixture.map)
            });
            const tree = context.getTree('pkg');
            const report = new TextReport(fixture.opts);
            tree.visit(report, context);
            const output = FileWriter.getOutput();
            output.should.equal(fixture.textReportExpected);
        });
    }

    fs.readdirSync(path.resolve(__dirname, '../fixtures/specs')).forEach(
        file => {
            if (file.indexOf('.json') !== -1) {
                createTest(file);
            }
        }
    );
});
