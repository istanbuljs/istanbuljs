/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

const Path = require('./path');
const {
    getFlatTree,
    getPkgTree,
    getNestedTree,
    Util
} = require('./summarizer');

class SummarizerFactory {
    constructor(coverageMap, defaultSummarizer = 'pkg') {
        this._coverageMap = coverageMap;
        this._defaultSummarizer = defaultSummarizer;
        this._initialList = coverageMap.files().map(filePath => ({
            filePath,
            path: new Path(filePath),
            fileCoverage: coverageMap.fileCoverageFor(filePath)
        }));
        this._commonParent = Util.findCommonParent(
            this._initialList.map(o => o.path.parent())
        );
        if (this._commonParent.length > 0) {
            this._initialList.forEach(o => {
                o.path.splice(0, this._commonParent.length);
            });
        }
    }

    callSummarizer(summarizerFunction) {
        return summarizerFunction(this._initialList, this._commonParent);
    }

    get defaultSummarizer() {
        return this[this._defaultSummarizer];
    }

    get flat() {
        if (!this._flat) {
            this._flat = this.callSummarizer(getFlatTree);
        }

        return this._flat;
    }

    get pkg() {
        if (!this._pkg) {
            this._pkg = this.callSummarizer(getPkgTree);
        }

        return this._pkg;
    }

    get nested() {
        if (!this._nested) {
            this._nested = this.callSummarizer(getNestedTree);
        }

        return this._nested;
    }
}

module.exports = SummarizerFactory;
