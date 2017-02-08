/* globals describe, it */
var assert = require('chai').assert,
    index = require('../index');

describe('exports', function () {
    it('exports the correct interface', function () {
        assert.isObject(index);
    });
});