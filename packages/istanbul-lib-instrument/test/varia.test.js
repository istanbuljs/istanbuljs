/* globals describe, it */

import { assert } from 'chai';
import Instrumenter from '../src/instrumenter';
import * as verifier from './util/verifier';

describe('varia', () => {
    it('debug/ walkDebug should not cause errors', () => {
        const v = verifier.create('output = args[0];', {}, { debug: true });
        assert.ok(!v.err);
        v.verify(['X'], 'X', {
            lines: { 1: 1 },
            statements: { 0: 1 }
        });
    });

    it('auto-generates filename', () => {
        const v = verifier.create('output = args[0];', { file: null });
        assert.ok(!v.err);
        v.verify(['X'], 'X', {
            lines: { 1: 1 },
            statements: { 0: 1 }
        });
    });

    it('handles windows-style paths in file names', () => {
        const v = verifier.create('output = args[0];', { file: 'c:\\x\\y.js' });
        assert.ok(!v.err);
        v.verify(['X'], 'X', {
            lines: { 1: 1 },
            statements: { 0: 1 }
        });

        const cov = v.getCoverage();
        assert.equal(Object.keys(cov)[0], 'c:\\x\\y.js');
    });

    it('preserves comments when requested', () => {
        const v = verifier.create(
            '/* hello */\noutput = args[0];',
            {},
            { preserveComments: true }
        );
        assert.ok(!v.err);
        v.verify(['X'], 'X', {
            lines: { 2: 1 },
            statements: { 0: 1 }
        });

        const code = v.getGeneratedCode();
        assert.ok(code.match(/\/* hello */));
    });

    it('preserves function names for named export arrow functions', () => {
        /* https://github.com/istanbuljs/babel-plugin-istanbul/issues/125 */
        const v = verifier.create(
            'export const func = () => true;',
            { generateOnly: true },
            { esModules: true }
        );
        assert.ok(!v.err);

        const code = v.getGeneratedCode();
        assert.ok(
            code.match(/cov_(.+)\.s\[\d+\]\+\+;export const func=\(\)=>/)
        );
    });

    it('honors ignore next for exported functions', () => {
        /* https://github.com/istanbuljs/istanbuljs/issues/297 */
        const v = verifier.create(
            '/* istanbul ignore next*/ export function fn1() {}' +
                '/* istanbul ignore next*/ export default function() {}',
            { generateOnly: true },
            { esModules: true, preserveComments: false }
        );
        assert.ok(!v.err);

        const code = v.getGeneratedCode();
        assert.ok(
            code.match(
                /return actualCoverage;}cov_[^(]+\(\);export function fn1\(\){}export default function\(\){}/
            )
        );
    });

    it('instruments exported functions', () => {
        /* https://github.com/istanbuljs/istanbuljs/issues/297 */
        const v = verifier.create(
            'export function fn1() {}' + 'export default function() {}',
            { generateOnly: true },
            { esModules: true }
        );
        assert.ok(!v.err);

        const code = v.getGeneratedCode();
        assert.ok(
            code.match(
                /return actualCoverage;}cov_([^(]+)\(\);export function fn1\(\){cov_(.+)\.f\[\d+\]\+\+;}export default function\(\){cov_(.+)\.f\[\d+\]\+\+;}/
            )
        );
    });

    it('returns last coverage object', cb => {
        const instrumenter = new Instrumenter({
            coverageVariable: '__testing_coverage__'
        });
        let err;
        let cov;

        instrumenter.instrument('output = args[0]', __filename, e => {
            err = e;
            cov = instrumenter.lastFileCoverage();
            assert.ok(!err);
            assert.ok(cov);
            cb();
        });
    });

    it('creates a source-map when requested', () => {
        const opts = {
            produceSourceMap: true,
            coverageVariable: '__testing_coverage__'
        };
        const instrumenter = new Instrumenter(opts);
        const generated = instrumenter.instrumentSync(
            'output = args[0]',
            __filename
        );

        assert.ok(generated);
        assert.ok(typeof generated === 'string');
        assert.ok(instrumenter.lastSourceMap());
    });

    it('registers source map URLs seen in the original source', () => {
        let f = '';
        let u = '';
        const fn = function(file, sourceMapUrl) {
            f = file;
            u = sourceMapUrl;
        };
        const opts = {
            sourceMapUrlCallback: fn,
            coverageVariable: '__testing_coverage__'
        };
        const instrumenter = new Instrumenter(opts);
        const generated = instrumenter.instrumentSync(
            '/* foobar */ output = args[0]\n// @sourceMappingURL=foo.map',
            __filename
        );

        assert.ok(generated);
        assert.equal(f, __filename);
        assert.equal(u, 'foo.map');
    });

    describe('callback style instrumentation', () => {
        it('allows filename to be optional', cb => {
            const instrumenter = new Instrumenter({
                coverageVariable: '__testing_coverage__'
            });
            let generated;
            let err;

            instrumenter.instrument('output = args[0]', (e, c) => {
                err = e;
                generated = c;
                assert.ok(!err);
                assert.ok(generated);
                cb();
            });
        });
        it('returns instead of throwing errors', () => {
            const instrumenter = new Instrumenter({
                coverageVariable: '__testing_coverage__'
            });
            let generated = null;
            let err = null;

            instrumenter.instrument('output = args[0] : 1: 2', (e, c) => {
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
    it('properly exports named classes', () => {
        const v = verifier.create(
            'export class App extends Component {};',
            { generateOnly: true },
            { esModules: true }
        );
        assert.ok(!v.err);

        const code = v.getGeneratedCode();
        assert.ok(
            code.match(
                /return actualCoverage;}cov_[^(]+\(\);export class App extends/
            )
        );
    });

    it('declares Function when needed', () => {
        const v = verifier.create(
            'function Function() {}',
            { generateOnly: true },
            { esModules: true }
        );
        assert.ok(!v.err);

        const code = v.getGeneratedCode();
        assert.ok(code.match(/var Function\s*=/));
    });

    it('does not declare Function when not needed', () => {
        const v = verifier.create(
            'function differentFunction() {}',
            { generateOnly: true },
            { esModules: true }
        );
        assert.ok(!v.err);

        const code = v.getGeneratedCode();
        assert.ok(!code.match(/var Function\s*=/));
    });

    it('does not add extra parenthesis when superclass is an identifier', () => {
        const v = verifier.create('class App extends Component {};', {
            generateOnly: true
        });
        assert.ok(!v.err);

        const code = v.getGeneratedCode();
        assert.ok(
            code.match(
                /return actualCoverage;}cov_[^(]+\(\);class App extends Component/
            )
        );
    });

    it('can store coverage object in alternative scope', () => {
        const opts = { generateOnly: true };
        const instrumentOpts = { coverageGlobalScope: 'window.top' };
        const v = verifier.create('console.log("test");', opts, instrumentOpts);
        assert.ok(!v.err);

        const code = v.getGeneratedCode();
        assert.ok(
            code.match(
                /global\s*=\s*\(*new\s*Function\(['"]return\s*window.top['"]\)\)*\(\)/
            )
        );
    });

    it('can store coverage object in alternative scope without function', () => {
        const opts = { generateOnly: true };
        const instrumentOpts = {
            coverageGlobalScope: 'window.top',
            coverageGlobalScopeFunc: false
        };
        const v = verifier.create('console.log("test");', opts, instrumentOpts);
        assert.ok(!v.err);

        const code = v.getGeneratedCode();
        assert.ok(code.match(/global\s*=\s*window.top;/));
    });
});
