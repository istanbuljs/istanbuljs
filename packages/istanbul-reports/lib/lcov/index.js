/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var LcovOnlyReport = require('../lcovonly');
var HtmlReport = require('../html');

function LcovReport() {
    this.lcov = new LcovOnlyReport({ file: 'lcov.info' });
    this.html = new HtmlReport({ subdir: 'lcov-report' });
}

['Start', 'End', 'Summary', 'SummaryEnd', 'Detail'].forEach(what => {
    var meth = 'on' + what;
    LcovReport.prototype[meth] = function() {
        var args = Array.prototype.slice.call(arguments);
        var lcov = this.lcov;
        var html = this.html;

        if (lcov[meth]) {
            lcov[meth].apply(lcov, args);
        }
        if (html[meth]) {
            html[meth].apply(html, args);
        }
    };
});

module.exports = LcovReport;
