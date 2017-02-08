/* globals describe, it */

var assert = require('chai').assert,
    index = require('../index');

describe('report interface', function() {
    it('exports the desired interface', function () {
        assert.isFunction(index.createContext);
        assert.isFunction(index.getDefaultWatermarks);
        assert.isObject(index.summarizers);
        assert.isFunction(index.summarizers.flat);
        assert.isFunction(index.summarizers.nested);
        assert.isFunction(index.summarizers.pkg);
    });
    it('exposes default watermarks', function () {
        var w = index.getDefaultWatermarks();
        assert.deepEqual({
            statements: [ 50, 80],
            functions: [ 50, 80],
            branches: [ 50, 80],
            lines: [ 50, 80],
        }, w);
    });
    it('creates a context without options', function () {
        assert.ok(index.createContext());
    });
});
