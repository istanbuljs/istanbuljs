/* globals describe, it */
import * as index from '../src/index';
import {assert} from 'chai';

describe('external interface', function () {
    it('exposes the correct objects', function () {
        var i = index.createInstrumenter();
        assert.ok(i);
        assert.ok(i.instrumentSync);
        assert.ok(i.instrument);
    });
});
