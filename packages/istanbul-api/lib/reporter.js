/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var path = require('path');
var configuration = require('./config');
var inputError = require('./input-error');
var libReport = require('istanbul-lib-report');
var libReports = require('istanbul-reports');
var minimatch = require('minimatch');

function Reporter(cfg, opts) {
    opts = opts || {};
    this.config = cfg || configuration.loadFile();
    this.dir = path.resolve(this.config.reporting.dir());
    this.reports = {};

    var summarizer = opts.summarizer;
    var s = this.config.reporting.summarizer();

    if (summarizer && typeof summarizer === 'function') {
        this.summarizer = summarizer;
    } else {
        summarizer = libReport.summarizers[s];
        if (!summarizer) {
            throw inputError.create(
                'Invalid summarizer in report config: ' + s
            );
        }
        this.summarizer = summarizer;
    }
}

Reporter.prototype = {
    /**
     * adds a report to be generated. Must be one of the entries returned
     * by `Report.getReportList()`
     * @method add
     * @param {String} fmt the format of the report to generate
     */
    add(fmt) {
        if (this.reports[fmt]) {
            // already added
            return;
        }
        var config = this.config;
        var rptConfig = config.reporting.reportConfig()[fmt] || {};
        rptConfig.verbose = config.verbose;
        try {
            if (this.config.verbose) {
                console.error('Create report', fmt, ' with', rptConfig);
            }
            this.reports[fmt] = libReports.create(fmt, rptConfig);
        } catch (ex) {
            throw inputError.create('Invalid report format [' + fmt + ']');
        }
    },
    /**
     * adds an array of report formats to be generated
     * @method addAll
     * @param {Array} fmts an array of report formats
     */
    addAll(fmts) {
        fmts.forEach(f => {
            this.add(f);
        });
    },
    /**
     * writes all reports added
     * @method write
     */
    write(coverageMap, opts) {
        opts = opts || {};
        var sourceFinder = opts.sourceFinder || null;
        var context;
        var tree;

        context = libReport.createContext({
            dir: this.dir,
            watermarks: this.config.reporting.watermarks(),
            sourceFinder
        });

        var excludes = this.config.instrumentation.excludes() || [];

        coverageMap.filter(
            file =>
                !excludes.some(exclude =>
                    minimatch(file, exclude, { dot: true })
                )
        );

        tree = this.summarizer(coverageMap);
        Object.keys(this.reports).forEach(name => {
            var report = this.reports[name];
            tree.visit(report, context);
        });
    }
};

module.exports = Reporter;
