/* globals describe, it */

var assert = require('chai').assert,
    path = require('path'),
    libCoverage = require('istanbul-lib-coverage'),
    reportSource = require('../lib/report-source');

describe('report-source', function() {
    it('provides all report source ops (stupid test for now)', function () {
        var map = libCoverage.createCoverageMap(),
            rs = reportSource.create(map);
        assert.ok(rs.getFinalCoverage() === map);
    });

    it('writes reports', function () {
        var called = 0,
            rpt = {
                onSummary: function () {
                    called += 1;
                }
            },
            map = libCoverage.createCoverageMap(),
            rs = reportSource.create(map);
        rs.writeReports(rpt, path.resolve(__dirname, '.data'));
        assert.equal(called, 1);
    });

    it('writes multiple reports', function () {
        var called = 0,
            rpt = {
                onSummary: function () {
                    called += 1;
                }
            },
            map = libCoverage.createCoverageMap(),
            rs = reportSource.create(map);
        rs.writeReports([rpt, rpt], path.resolve(__dirname, '.data'));
        assert.equal(called, 2);
    });
});
