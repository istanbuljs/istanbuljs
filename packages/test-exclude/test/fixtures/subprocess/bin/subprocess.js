#!/usr/bin/env node

'use strict';

const assert = require('assert');
const testExclude = require('../../../..');

const e = testExclude({
    configKey: 'a'
});

assert.strictEqual(e.configFound, true);
assert.strictEqual(e.shouldInstrument('foo.js'), true);
assert.strictEqual(e.shouldInstrument('batman.js'), false);
