/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
const LcovOnlyReport = require('../lcovonly');
const HtmlReport = require('../html');

function LcovReport() {
    this.lcov = new LcovOnlyReport({ file: 'lcov.info' });
    this.html = new HtmlReport({ subdir: 'lcov-report' });
}

['Start', 'End', 'Summary', 'SummaryEnd', 'Detail'].forEach(what => {
    const meth = 'on' + what;
    LcovReport.prototype[meth] = function() {
        const args = Array.prototype.slice.call(arguments);
        const lcov = this.lcov;
        const html = this.html;

        if (lcov[meth]) {
            lcov[meth].apply(lcov, args);
        }
        if (html[meth]) {
            html[meth].apply(html, args);
        }
    };
});

module.exports = LcovReport;
