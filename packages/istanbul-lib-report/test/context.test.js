'use strict';
/* globals describe, it */

const assert = require('chai').assert;
const { createContext } = require('..');
const Context = require('../lib/context');
const coverageMap = require('./helpers/coverage-map');

const optsEmptyCoverage = {
    coverageMap: coverageMap.empty
};

describe('context', () => {
    it('provides a writer when not specified', () => {
        const ctx = createContext(optsEmptyCoverage);
        const w = ctx.writer;

        assert.ok(w);
        assert.ok(w === ctx.writer);
        assert.ok(w === ctx.getWriter());
    });
    it('returns an XML writer', () => {
        const ctx = new Context(optsEmptyCoverage);
        const w = ctx.writer;
        const cw = w.writeFile(null);
        assert.ok(ctx.getXMLWriter(cw));
    });
    it('returns source text by default', () => {
        const ctx = new Context(optsEmptyCoverage);
        const file = __filename;
        assert.ok(ctx.getSource(file));
    });
    it('throws when source file not found', () => {
        const ctx = new Context(optsEmptyCoverage);
        const file = __filename;
        assert.throws(ctx.getSource.bind(ctx, file + '.xxx'));
    });
    it('provides the correct classes for default watermarks', () => {
        const ctx = new Context(optsEmptyCoverage);
        assert.equal(ctx.classForPercent('statements', 49), 'low');
        assert.equal(ctx.classForPercent('branches', 50), 'medium');
        assert.equal(ctx.classForPercent('functions', 80), 'high');
        assert.equal(ctx.classForPercent('lines', 85), 'high');
        assert.equal(ctx.classForPercent('xlines', 85), 'unknown');
    });
    it('allows watermark overrides', () => {
        const watermarks = {
            statements: {},
            branches: [10],
            lines: [90, 95]
        };
        const ctx = new Context({
            watermarks,
            coverageMap: coverageMap.empty
        });
        assert.equal(ctx.classForPercent('statements', 49), 'low');
        assert.equal(ctx.classForPercent('branches', 50), 'medium');
        assert.equal(ctx.classForPercent('functions', 80), 'high');
        assert.equal(ctx.classForPercent('lines', 85), 'low');
    });
    it('returns a visitor', () => {
        const ctx = new Context(optsEmptyCoverage);
        const visitor = ctx.getVisitor({});
        assert.ok(typeof visitor.onStart === 'function');
    });
});
