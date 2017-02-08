/* globals describe, it */

var assert = require('chai').assert,
    context = require('../lib/context');

describe('context', function() {
    it('provides a writer when not specified', function () {
        var ctx = context.create(),
            w = ctx.writer;

        assert.ok(w);
        assert.ok(w === ctx.writer);
        assert.ok(w === ctx.getWriter());
    });
    it('returns an XML writer', function () {
        var ctx = context.create(),
            w = ctx.writer,
            cw = w.writeFile(null);
        assert.ok(ctx.getXMLWriter(cw));
    });
    it('returns source text by default', function () {
        var ctx = context.create(),
            file = __filename;
        assert.ok(ctx.getSource(file));
    });
    it('throws when source file not found', function () {
        var ctx = context.create(),
            file = __filename;
        assert.throws(ctx.getSource.bind(ctx, file + ".xxx"));
    });
    it('provides the correct classes for default watermarks', function () {
        var ctx = context.create();
        assert.equal(ctx.classForPercent('statements', 49), 'low');
        assert.equal(ctx.classForPercent('branches', 50), 'medium');
        assert.equal(ctx.classForPercent('functions', 80), 'high');
        assert.equal(ctx.classForPercent('lines', 85), 'high');
        assert.equal(ctx.classForPercent('xlines', 85), 'unknown');
    });
    it('allows watermark overrides', function () {
        var w = {
            statements: {},
            branches: [ 10 ],
            lines: [90, 95]
        },
            ctx = context.create({watermarks: w});
        assert.equal(ctx.classForPercent('statements', 49), 'low');
        assert.equal(ctx.classForPercent('branches', 50), 'medium');
        assert.equal(ctx.classForPercent('functions', 80), 'high');
        assert.equal(ctx.classForPercent('lines', 85), 'low');
    });
    it('returns a visitor', function () {
        var ctx = context.create(),
            visitor = ctx.getVisitor({});
        assert.ok(typeof visitor.onStart === 'function');
    });
});