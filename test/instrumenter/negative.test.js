/* globals describe, it */

var verifier = require('./util/verifier'),
    assert = require('chai').assert;

describe('negative tests', function () {
    it('should barf on junk code', function () {
        var v = verifier.create('output = args[0] : 1 : 2;');
        assert.ok(v.err);
        assert.ok(v.err.message.match(/Unexpected token/));
    });

    it('should barf on non-string code', function () {
        var v = verifier.create({});
        assert.ok(v.err);
        assert.ok(v.err.message.match(/must be string/));
    });

    it('should barf on mainline returns with no auto-wrap', function () {
        var v = verifier.create('return 10;');
        assert.ok(v.err);
        assert.ok(v.err.message.match(/Illegal return/));
    });
});
