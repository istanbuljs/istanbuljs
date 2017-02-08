/* globals describe, it */

var assert = require('chai').assert,
    index = require('../index');

describe('index', function () {
    it('exports the correct interface', function () {
        assert.isObject(index.config);
        assert.isFunction(index.matcherFor);
        assert.isFunction(index.filesFor);
        assert.isFunction(index.createReporter);
        assert.isObject(index.cover);
        assert.isObject(index.instrument);
        assert.isObject(index.checkCoverage);
        assert.isObject(index.reports);
        assert.isObject(index.libCoverage);
        assert.isObject(index.libInstrument);
        assert.isObject(index.libHook);
        assert.isObject(index.libReport);
        assert.isObject(index.libSourceMaps);
        assert.isObject(index.reportsImpl);
        assert.doesNotThrow(function () {
            index.createReporter(index.config.loadObject({}));
        });
    });
});
