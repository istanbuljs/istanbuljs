/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var path = require('path'),
    configuration = require('./config'),
    inputError = require('./input-error'),
    libReport = require('istanbul-lib-report'),
    libReports = require('istanbul-reports');

function Reporter(cfg) {
    this.config = cfg || configuration.loadFile();
    this.dir = path.resolve(this.config.reporting.dir());
    this.reports = {};

    var s = this.config.reporting.summarizer(),
        summarizer;
    if (s && typeof s === 'string') {
        summarizer = libReport.summarizers[s];
        if (!summarizer) {
            throw inputError.create('Invalid summarizer in report config: ' + s);
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
    add: function (fmt) {
        if (this.reports[fmt]) { // already added
            return;
        }
        var config = this.config,
            rptConfig = config.reporting.reportConfig()[fmt] || {};
        rptConfig.verbose = config.verbose;
        try {
            if (this.config.verbose) {
                console.error('Create report', fmt,' with', rptConfig);
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
    addAll: function (fmts) {
        var that = this;
        fmts.forEach(function (f) {
            that.add(f);
        });
    },
    /**
     * writes all reports added
     * @method write
     */
    write: function (coverageMap, opts) {
        opts = opts || {};
        var that = this,
            sourceFinder = opts.sourceFinder || null,
            context,
            reportSource,
            rpts = [];

        context = libReport.createContext({
            dir: this.dir,
            watermarks: this.config.reporting.watermarks(),
            sourceFinder: sourceFinder,
            summarizer: this.summarizer
        });
        delete opts.sourceFinder;
        reportSource = libReport.createReportSource(coverageMap, opts);
        Object.keys(this.reports).forEach(function (k) {
            rpts.push(that.reports[k]);
        });
        reportSource.writeReports(rpts, context);
    }
};

module.exports = Reporter;
