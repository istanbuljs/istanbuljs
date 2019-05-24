'use strict';
/* globals describe, it */
const assert = require('chai').assert;
const index = require('../index');

describe('exports', () => {
    it('exports the correct interface', () => {
        assert.isObject(index);
    });
});
