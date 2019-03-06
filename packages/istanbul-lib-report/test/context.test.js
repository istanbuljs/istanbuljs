/* globals describe, it */

var assert = require('chai').assert;
var context = require('../lib/context');

describe('context', () => {
    it('provides a writer when not specified', () => {
        var ctx = context.create();
        var w = ctx.writer;

        assert.ok(w);
        assert.ok(w === ctx.writer);
        assert.ok(w === ctx.getWriter());
    });
    it('returns an XML writer', () => {
        var ctx = context.create();
        var w = ctx.writer;
        var cw = w.writeFile(null);
        assert.ok(ctx.getXMLWriter(cw));
    });
    it('returns source text by default', () => {
        var ctx = context.create();
        var file = __filename;
        assert.ok(ctx.getSource(file));
    });
    it('throws when source file not found', () => {
        var ctx = context.create();
        var file = __filename;
        assert.throws(ctx.getSource.bind(ctx, file + '.xxx'));
    });
    it('provides the correct classes for default watermarks', () => {
        var ctx = context.create();
        assert.equal(ctx.classForPercent('statements', 49), 'low');
        assert.equal(ctx.classForPercent('branches', 50), 'medium');
        assert.equal(ctx.classForPercent('functions', 80), 'high');
        assert.equal(ctx.classForPercent('lines', 85), 'high');
        assert.equal(ctx.classForPercent('xlines', 85), 'unknown');
    });
    it('allows watermark overrides', () => {
        var w = {
            statements: {},
            branches: [10],
            lines: [90, 95]
        };
        var ctx = context.create({ watermarks: w });
        assert.equal(ctx.classForPercent('statements', 49), 'low');
        assert.equal(ctx.classForPercent('branches', 50), 'medium');
        assert.equal(ctx.classForPercent('functions', 80), 'high');
        assert.equal(ctx.classForPercent('lines', 85), 'low');
    });
    it('returns a visitor', () => {
        var ctx = context.create();
        var visitor = ctx.getVisitor({});
        assert.ok(typeof visitor.onStart === 'function');
    });
});
