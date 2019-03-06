/* globals describe, it */
var assert = require('chai').assert;
var index = require('../index');

describe('exports', () => {
    it('exports the correct interface', () => {
        assert.isObject(index);
    });
});
