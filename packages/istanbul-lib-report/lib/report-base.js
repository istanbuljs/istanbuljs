'use strict';

class ReportBase {
    constructor(opts = {}) {
        this._summarizer = opts.summarizer;
    }

    execute(context) {
        context.getTree(this._summarizer).visit(this, context);
    }
}

module.exports = ReportBase;
