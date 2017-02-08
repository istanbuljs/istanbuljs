/* global describe, it */

var index = require('../index'),
    assert = require('chai').assert;

describe('external interface', function () {
    it('exports the correct interface', function () {
        assert.ok(index.hookRequire);
        assert.ok(index.hookRunInThisContext);
    });
});
