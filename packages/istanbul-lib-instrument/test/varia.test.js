/* globals describe, it */

import * as verifier from './util/verifier';
import Instrumenter from '../src/instrumenter';
import {assert} from 'chai';

describe('varia', function () {
    it('debug/ walkDebug should not cause errors', function () {
        var v = verifier.create('output = args[0];', {}, { debug: true});
        assert.ok(!v.err);
        v.verify(['X'], 'X',{
            lines: { 1: 1 },
            statements: { 0: 1}
        });
    });

    it('auto-generates filename', function () {
        var v = verifier.create('output = args[0];', { file: null});
        assert.ok(!v.err);
        v.verify(['X'], 'X',{
            lines: { 1: 1 },
            statements: { 0: 1}
        });
    });

    it('handles windows-style paths in file names', function () {
        var v = verifier.create('output = args[0];', { file: 'c:\\x\\y.js'}),
            cov;
        assert.ok(!v.err);
        v.verify(['X'], 'X',{
            lines: { 1: 1 },
            statements: { 0: 1}
        });
        cov = v.getCoverage();
        assert.equal(Object.keys(cov)[0],'c:\\x\\y.js');
    });

    it('preserves comments when requested', function () {
        var v = verifier.create('/* hello */\noutput = args[0];', {}, { preserveComments: true }),
            code;
        assert.ok(!v.err);
        v.verify(['X'], 'X',{
            lines: { 2: 1 },
            statements: { 0: 1}
        });
        code = v.getGeneratedCode();
        assert.ok(code.match(/\/* hello */));
    });

    it('preserves function names for named export arrow functions', function () {
        /* https://github.com/istanbuljs/babel-plugin-istanbul/issues/125 */
        var v = verifier.create('export const func = () => true;', { generateOnly: true }, { esModules: true }),
            code;
        assert.ok(!v.err);
        code = v.getGeneratedCode();
        assert.ok(code.match(/cov_(.+)\.s\[\d+\]\+\+;export const func=\(\)=>/));
    });

    it('returns last coverage object', function (cb) {
        var instrumenter = new Instrumenter({coverageVariable: '__testing_coverage__'}),
            generated,
            err,
            cov;

        instrumenter.instrument('output = args[0]',__filename, function (e, c) {
            err = e;
            generated = c;
            cov = instrumenter.lastFileCoverage();
            assert.ok(!err);
            assert.ok(cov);
            cb();
        });
    });

    it('creates a source-map when requested', function () {
        var opts = {
                produceSourceMap: true,
                coverageVariable: '__testing_coverage__'
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
                sourceMapUrlCallback: fn,
                coverageVariable: '__testing_coverage__'
            },
            instrumenter = new Instrumenter(opts),
            generated = instrumenter.instrumentSync('/* foobar */ output = args[0]\n// @sourceMappingURL=foo.map', __filename);

        assert.ok(generated);
        assert.equal(f, __filename);
        assert.equal(u, 'foo.map');
    });

    describe('callback style instrumentation', function () {
        it('allows filename to be optional', function (cb) {
            var instrumenter = new Instrumenter({coverageVariable: '__testing_coverage__'}),
                generated,
                err;

            instrumenter.instrument('output = args[0]', function (e, c) {
                err = e;
                generated = c;
                assert.ok(!err);
                assert.ok(generated);
                cb();
            });
        });
        it('returns instead of throwing errors', function () {
            var instrumenter = new Instrumenter({coverageVariable: '__testing_coverage__'}),
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

    // see: https://github.com/istanbuljs/istanbuljs/issues/110
    // TODO: it feels like we should be inserting line counters
    // for class exports and class declarations.
    it('properly exports named classes', function () {
        var v = verifier.create('export class App extends Component {};', { generateOnly: true }, { esModules: true }),
            code;
        assert.ok(!v.err);
        code = v.getGeneratedCode();
        assert.ok(code.match(/cov_(.+);export class App extends/));
    });
});
