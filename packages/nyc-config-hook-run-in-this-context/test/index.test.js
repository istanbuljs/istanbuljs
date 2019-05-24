'use strict';
/* global describe, it */

const assert = require('chai').assert;
const index = require('../index');

describe('external interface', () => {
    it('exports the correct interface', () => {
        assert.equal(typeof index, 'object');
        assert.ok('hook-require' in index);
        assert.equal(index['hook-run-in-this-context'], true);
    });
});
