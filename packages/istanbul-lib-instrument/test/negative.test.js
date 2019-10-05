/* globals describe, it */

import { assert } from 'chai';
import * as verifier from './util/verifier';

describe('negative tests', () => {
    it('should barf on junk code', () => {
        const v = verifier.create('output = args[0] : 1 : 2;', { quiet: true });
        const err = v.compileError();
        assert.ok(err);
        assert.ok(err.message.match(/Unexpected token/));
    });

    it('should barf on non-string code', () => {
        const v = verifier.create({}, { quiet: true });
        const err = v.compileError();
        assert.ok(err);
        assert.ok(err.message.match(/must be a string/));
    });

    it('should barf on mainline returns with no auto-wrap', () => {
        const v = verifier.create(
            'return 10;',
            { quiet: true },
            { autoWrap: false }
        );
        const err = v.compileError();
        assert.ok(err);
        assert.ok(err.message.match(/'return' outside/));
    });
});
