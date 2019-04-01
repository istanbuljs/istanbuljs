/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
const path = require('path');
const libReport = require('istanbul-lib-report');
const libReports = require('istanbul-reports');
const ModernHtmlReport = require('istanbul-report-modern-html');
const minimatch = require('minimatch');
const inputError = require('./input-error');
const configuration = require('./config');

function Reporter(cfg, opts) {
    opts = opts || {};
    this.config = cfg || configuration.loadFile();
    this.dir = path.resolve(this.config.reporting.dir());
    this.reports = {};

    let summarizer = opts.summarizer;
    const s = this.config.reporting.summarizer();

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
        const config = this.config;
        const rptConfig = config.reporting.reportConfig()[fmt] || {};
        rptConfig.verbose = config.verbose;
        try {
            if (this.config.verbose) {
                console.error('Create report', fmt, ' with', rptConfig);
            }

            // TODO: Not sure - other options are that a user can pass in 'istanbul-report-modern-html'
            //       and it will be required in the catch inside libReports.create. This would remove the direct
            //       dependency (at the cost of making it harder to specify/inconsistency)
            if (fmt === 'modern-html') {
                this.reports[fmt] = new ModernHtmlReport(rptConfig);
            } else {
                this.reports[fmt] = libReports.create(fmt, rptConfig);
            }
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
        const sourceFinder = opts.sourceFinder || null;

        const context = libReport.createContext({
            dir: this.dir,
            watermarks: this.config.reporting.watermarks(),
            sourceFinder
        });

        const excludes = this.config.instrumentation.excludes() || [];

        coverageMap.filter(
            file =>
                !excludes.some(exclude =>
                    minimatch(file, exclude, { dot: true })
                )
        );

        // TODO:
        // Other options were: a) just have a partly broken report if the summarizer isn't nested.
        // This isn't nice since the summarizer option is across all reports b) hard-code modern-html to have
        // nested. I could also make this code nicer with lodash, but it isn't currently a dependency
        const summarizerNameToReports = {};
        Object.keys(this.reports).forEach(name => {
            const report = this.reports[name];
            let requiredSummarizer = 'default';
            if (report.requiresSummarizer) {
                requiredSummarizer = report.requiresSummarizer();
            }
            if (!summarizerNameToReports[requiredSummarizer]) {
                summarizerNameToReports[requiredSummarizer] = [];
            }
            summarizerNameToReports[requiredSummarizer].push(report);
        });

        Object.keys(summarizerNameToReports).forEach(name => {
            const reports = summarizerNameToReports;
            Object.keys(this.reports).forEach(name => {
                const report = this.reports[name];
                tree.visit(report, context);
            });
            tree.visit(report, context);
        });

        const tree = this.summarizer(coverageMap);
        Object.keys(this.reports).forEach(name => {
            const report = this.reports[name];
            tree.visit(report, context);
        });
    }
};

module.exports = Reporter;
