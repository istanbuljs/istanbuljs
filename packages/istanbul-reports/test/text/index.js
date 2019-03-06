/* globals describe, it, beforeEach, before, after */
var fs = require('fs');
var isWindows = require('is-windows');
var path = require('path');
var FileWriter = require('istanbul-lib-report/lib/file-writer');
var istanbulLibReport = require('istanbul-lib-report');
var istanbulLibCoverage = require('istanbul-lib-coverage');
var TextReport = require('../../lib/text/index');

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
        var fixture = require(path.resolve(
            __dirname,
            '../fixtures/specs/' + file
        ));
        fixture.map = istanbulLibReport.summarizers.pkg(
            istanbulLibCoverage.createCoverageMap(fixture.map)
        );
        it(fixture.title, function() {
            if (isWindows()) {
                // appveyor does not render console color.
                return this.skip();
            }
            var context = istanbulLibReport.createContext({
                dir: './'
            });
            var tree = fixture.map;
            var report = new TextReport(fixture.opts);
            tree.visit(report, context);
            var output = FileWriter.getOutput();
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
