'use strict';
/* globals describe, it, beforeEach, before, after */
const fs = require('fs');
const path = require('path');
const isWindows = require('is-windows');
const FileWriter = require('istanbul-lib-report/lib/file-writer');
const istanbulLibReport = require('istanbul-lib-report');
const istanbulLibCoverage = require('istanbul-lib-coverage');
const JsonReport = require('../../lib/json/index');

require('chai').should();

describe('JsonReport', () => {
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

            if (!fixture.opts) fixture.opts = {}; // fix missing opts
            fixture.opts.file = '-'; // disable file output

            const report = new JsonReport(fixture.opts);
            tree.visit(report, context);
            const output = FileWriter.getOutput();
            output.should.equal(fixture.jsonExpected);
        });
    }

    fs.readdirSync(path.resolve(__dirname, '../fixtures/specs')).forEach(
        file => {
            if (file.indexOf('.json') !== -1) {
                createTest(file);
            }
        }
    );

    // Some kind of strange race condition appears makes the test fail when running all test at once.
    // But if you run this test case below alone, it passes.
    // createTest('100-line-missing-branch.json');
});
