/* globals describe, it */

var verifier = require('./util/verifier'),
    Instrumenter = require('../../lib/instrumenter'),
    assert = require('chai').assert,
    esprima = require('esprima');

describe('varia', function () {
    it('debug/ walkDebug should not cause errors', function () {
        var v = verifier.create('output = args[0];', { debug: true, walkDebug: true});
        assert.ok(!v.err);
        v.verify(['X'], 'X',{
            lines: { 1: 1 },
            statements: { 1: 1}
        });
    });

    it('auto-generates filename', function () {
        var v = verifier.create('output = args[0];', { file: null});
        assert.ok(!v.err);
        v.verify(['X'], 'X',{
            lines: { 1: 1 },
            statements: { 1: 1}
        });
    });

    it('handles windows-style paths in file names', function () {
        var v = verifier.create('output = args[0];', { file: 'c:\\x\\y.js'}),
            cov;
        assert.ok(!v.err);
        v.verify(['X'], 'X',{
            lines: { 1: 1 },
            statements: { 1: 1}
        });
        cov = v.getCoverage();
        assert.equal(Object.keys(cov)[0],'c:\\x\\y.js');
    });

    it('works with noAutoWrap for legal code', function () {
        var v = verifier.create('output = args[0];', { noAutoWrap: true });
        assert.ok(!v.err);
        v.verify(['X'], 'X',{
            lines: { 1: 1 },
            statements: { 1: 1}
        });
    });

    it('preserves comments when requested', function () {
        var v = verifier.create('/* hello */\noutput = args[0];', { preserveComments: true }),
            code;
        assert.ok(!v.err);
        v.verify(['X'], 'X',{
            lines: { 2: 1 },
            statements: { 1: 1}
        });
        code = v.getGeneratedCode();
        assert.ok(code.match(/\/* hello */));
    });

    it('returns last coverage object', function () {
        var instrumenter = new Instrumenter(),
            generated,
            err,
            cov;

        instrumenter.instrument('output = args[0]',__filename, function (e, c) {
            err = e;
            generated = c;
            cov = instrumenter.lastFileCoverage();
        });
        assert.ok(!err);
        assert.ok(cov);
    });

    it('creates a source-map when requested', function () {
        var opts = {
                codeGenerationOptions: {
                   sourceMap: 'bar',
                   sourceMapWithCode: true
                }
            },
            instrumenter = new Instrumenter(opts),
            generated = instrumenter.instrumentSync('output = args[0]', __filename);

        assert.ok(generated);
        assert.ok(typeof generated === 'string');
        assert.ok(instrumenter.lastSourceMap());
    });

    it('registers source map URLs seen in the original source', function () {
        var f = '',
            u = '',
            fn = function (file, sourceMapUrl) {
                f = file;
                u = sourceMapUrl;
            },
            opts = {
                sourceMapUrlCallback: fn
            },
            instrumenter = new Instrumenter(opts),
            generated = instrumenter.instrumentSync('/* foobar */ output = args[0]\n// @sourceMappingURL=foo.map', __filename);

        assert.ok(generated);
        assert.equal(f, __filename);
        assert.equal(u, 'foo.map');
    });

    describe('node type property', function () {
        it('requires a type property for general nodes', function () {
            var ast = esprima.parse('var foo = 1;', { loc: true }),
                instrumenter = new Instrumenter();
            delete ast.body[0].type;
            try {
                instrumenter.instrumentASTSync(ast);
                assert.ok(false,'instrumentation succeeded when it should not have');
            } catch (ex) {
               //ok
            }
        });

        it('tolerates a missing node type for a property node', function () {
            var ast = esprima.parse('var foo = { a: 1 };', { loc: true }),
                instrumenter = new Instrumenter();
            delete ast.body[0].declarations[0].init.properties[0].type;
            try {
                instrumenter.instrumentASTSync(ast);
            } catch (ex) {
                assert.ok(false, 'instrumentation should have succeeded but did not');
            }
        });
    });

    describe('callback style instrumentation', function () {
        it('allows filename to be optional', function () {
            var instrumenter = new Instrumenter(),
                generated,
                err;

            instrumenter.instrument('output = args[0]', function (e, c) {
                err = e;
                generated = c;
            });
            assert.ok(!err);
            assert.ok(generated);
        });
        it('returns instead of throwing errors', function () {
            var instrumenter = new Instrumenter(),
                generated = null,
                err = null;

            instrumenter.instrument('output = args[0] : 1: 2', function (e, c) {
                err = e;
                generated = c;
            });
            assert.ok(err);
            assert.ok(!generated);
        });
    });
});
