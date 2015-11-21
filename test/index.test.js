/* globals describe, it */

var index = require('../index'),
    assert = require('chai').assert;

describe('external interface', function () {
    it('exposes the correct objects', function () {
        var i = index.createInstrumenter();
        assert.ok(i);
        assert.ok(i.instrumentSync);
        assert.ok(i.instrumentASTSync);
        assert.ok(i.instrument);
    });
});


