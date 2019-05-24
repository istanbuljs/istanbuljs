'use strict';
/* global describe, it */

const assert = require('chai').assert;
const index = require('../index');

describe('external interface', () => {
    it('exports the correct interface', () => {
        assert.ok(index.hookRequire);
        assert.ok(index.hookRunInThisContext);
        assert.ok(index.hookRunInContext);
    });
});
