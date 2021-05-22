'use strict';
/* globals describe, it */

const assert = require('chai').assert;
const summarizer = require('../summarizer');

describe('summarizer interface', () => {
    it('exports the desired interface', () => {
        // The "istanbul-lib-report/summarizer" entry point exports everything you need
        // to build a custom summarizer function, which can be passed to a ReportBase subclass.
        assert.isFunction(summarizer.ReportTree);
        assert.isFunction(summarizer.ReportNode);
        assert.isFunction(summarizer.Path);
        assert.isObject(summarizer.Util);
    });
});
