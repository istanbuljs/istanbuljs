/* globals describe, it */
import * as index from '../src/index';
import {assert} from 'chai';

describe('external interface', function () {
    it('exposes the correct objects', function () {
        const i = index.createInstrumenter();
        assert.ok(i);
        assert.ok(i.instrumentSync);
        assert.ok(i.instrument);
        const pc = index.programVisitor;
        assert.ok(pc);
        assert.isFunction(pc);
    });
});

describe('instrumenter', function() {
    it('should remove comments when asked to', function() {
        const instrumenter = index.createInstrumenter({
            preserveComments: false
        });
        const instrumentedCode = instrumenter.instrumentSync('/*foo*/\n//bar\ncode = true', 'somefile.js');
        assert.equal(instrumentedCode.indexOf('foo'), -1, 'block comment not removed');
        assert.equal(instrumentedCode.indexOf('bar'), -1, 'line comment not removed');
    });
});

