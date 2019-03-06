/* globals describe, it */

const assert = require('chai').assert;
const context = require('../lib/context');

describe('context', () => {
    it('provides a writer when not specified', () => {
        const ctx = context.create();
        const w = ctx.writer;

        assert.ok(w);
        assert.ok(w === ctx.writer);
        assert.ok(w === ctx.getWriter());
    });
    it('returns an XML writer', () => {
        const ctx = context.create();
        const w = ctx.writer;
        const cw = w.writeFile(null);
        assert.ok(ctx.getXMLWriter(cw));
    });
    it('returns source text by default', () => {
        const ctx = context.create();
        const file = __filename;
        assert.ok(ctx.getSource(file));
    });
    it('throws when source file not found', () => {
        const ctx = context.create();
        const file = __filename;
        assert.throws(ctx.getSource.bind(ctx, file + '.xxx'));
    });
    it('provides the correct classes for default watermarks', () => {
        const ctx = context.create();
        assert.equal(ctx.classForPercent('statements', 49), 'low');
        assert.equal(ctx.classForPercent('branches', 50), 'medium');
        assert.equal(ctx.classForPercent('functions', 80), 'high');
        assert.equal(ctx.classForPercent('lines', 85), 'high');
        assert.equal(ctx.classForPercent('xlines', 85), 'unknown');
    });
    it('allows watermark overrides', () => {
        const w = {
            statements: {},
            branches: [10],
            lines: [90, 95]
        };
        const ctx = context.create({ watermarks: w });
        assert.equal(ctx.classForPercent('statements', 49), 'low');
        assert.equal(ctx.classForPercent('branches', 50), 'medium');
        assert.equal(ctx.classForPercent('functions', 80), 'high');
        assert.equal(ctx.classForPercent('lines', 85), 'low');
    });
    it('returns a visitor', () => {
        const ctx = context.create();
        const visitor = ctx.getVisitor({});
        assert.ok(typeof visitor.onStart === 'function');
    });
});
