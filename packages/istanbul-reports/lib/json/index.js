/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';
const { ReportBase } = require('istanbul-lib-report');
const path = require('path');
class JsonReport extends ReportBase {
    constructor(opts) {
        super();

        this.file = opts.file || 'coverage-final.json';
        this.projectRoot = opts.projectRoot || process.cwd();
        this.first = true;
    }

    onStart(root, context) {
        this.contentWriter = context.writer.writeFile(this.file);
        this.contentWriter.write('{');
    }

    onDetail(node) {
        const fc = node.getFileCoverage();

        const key = path.relative(this.projectRoot, fc.path);
        fc.data.path = path.relative(this.projectRoot, fc.data.path);

        const cw = this.contentWriter;

        if (this.first) {
            this.first = false;
        } else {
            cw.write(',');
        }
        cw.write(JSON.stringify(key));
        cw.write(': ');
        cw.write(JSON.stringify(fc));
        cw.println('');
    }

    onEnd() {
        const cw = this.contentWriter;
        cw.println('}');
        cw.close();
    }
}

module.exports = JsonReport;
