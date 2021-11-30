'use strict';
/* globals describe, it, beforeEach, before, after */
const fs = require('fs');
const path = require('path');
const isWindows = require('is-windows');
const FileWriter = require('istanbul-lib-report/lib/file-writer');
const istanbulLibReport = require('istanbul-lib-report');
const istanbulLibCoverage = require('istanbul-lib-coverage');
const LcovOnlyReport = require('../../lib/lcovonly/index');

require('chai').should();

describe('LcovOnlyReport', () => {
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
            const report = new LcovOnlyReport(fixture.opts);
            tree.visit(report, context);
            const output = FileWriter.getOutput().replace(/SF:.*/, 'SF:');
            if (fixture.lcovonlyExpected) {
                output.should.equal(fixture.lcovonlyExpected);
            }
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
