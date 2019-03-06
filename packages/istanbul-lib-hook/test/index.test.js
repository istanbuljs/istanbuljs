/* global describe, it */

var index = require('../index');
var assert = require('chai').assert;

describe('external interface', () => {
    it('exports the correct interface', () => {
        assert.ok(index.hookRequire);
        assert.ok(index.hookRunInThisContext);
        assert.ok(index.hookRunInContext);
    });
});
