/* globals describe, it */

import * as verifier from './util/verifier';
import {assert} from 'chai';

describe('negative tests', function () {
    it('should barf on junk code', function () {
        const v = verifier.create('output = args[0] : 1 : 2;', {quiet: true});
        const err = v.compileError();
        assert.ok(err);
        assert.ok(err.message.match(/Unexpected token/));
    });

    it('should barf on non-string code', function () {
        var v = verifier.create({}, {quiet: true});
        const err = v.compileError();
        assert.ok(err);
        assert.ok(err.message.match(/must be a string/));
    });

    it('should barf on mainline returns with no auto-wrap', function () {
        var v = verifier.create('return 10;', {quiet: true});
        const err = v.compileError();
        assert.ok(err);
        assert.ok(err.message.match(/'return' outside/));
    });
});
