/* globals describe, it, beforeEach, afterEach */

const path = require('path');
const assert = require('chai').assert;
const configuration = require('../lib/config');
const hijack = require('./hijack-streams');

const newCwd = path.resolve(__dirname, 'config-data');
const oldCwd = process.cwd();
let config;
const reset = hijack.reset;

describe('config', () => {
    beforeEach(hijack.silent);
    afterEach(reset);

    describe('no explicit config', () => {
        beforeEach(() => {
            config = configuration.loadObject(null);
        });

        it('sets verbose option', () => {
            assert.equal(config.verbose, false);
            reset();
        });
        it('sets sane instrument options', () => {
            const iOpts = config.instrumentation;
            assert.equal(iOpts.root(), process.cwd());
            assert.equal(iOpts.defaultExcludes(), true);
            assert.equal(iOpts.variable(), '__coverage__');
            assert.equal(iOpts.compact(), true);
            assert.equal(iOpts.preserveComments(), false);
            assert.equal(iOpts.completeCopy(), false);
            assert.equal(iOpts.saveBaseline(), false);
            assert.equal(iOpts.includeAllSources(), false);
            assert.equal(
                iOpts.baselineFile(),
                './coverage/coverage-baseline.raw.json'
            );
            assert.deepEqual(iOpts.excludes(), ['**/node_modules/**']);
            assert.deepEqual(iOpts.excludes(true), [
                '**/node_modules/**',
                '**/test/**',
                '**/tests/**'
            ]);
            reset();
        });
        it('sets correct reporting options', () => {
            const rOpts = config.reporting;
            assert.equal(rOpts.print(), 'summary');
            assert.deepEqual(rOpts.reports(), ['lcov']);
            assert.equal(rOpts.dir(), './coverage');
            reset();
        });
        it('sets correct hook options', () => {
            const hOpts = config.hooks;
            assert.equal(hOpts.hookRunInContext(), false);
            assert.equal(hOpts.hookRunInThisContext(), false);
            assert.equal(hOpts.postRequireHook(), null);
            reset();
        });
    });
    describe('when overrides passed in', () => {
        describe('as initial object', () => {
            it('uses overrides', () => {
                config = configuration.loadObject({
                    instrumentation: {
                        compact: false,
                        'save-baseline': true
                    }
                });
                assert.equal(config.instrumentation.compact(), false);
                assert.equal(config.instrumentation.saveBaseline(), true);
                reset();
            });
        });
        describe('as override object', () => {
            it('uses overrides', () => {
                config = configuration.loadObject(
                    {},
                    {
                        verbose: true,
                        instrumentation: {
                            compact: false,
                            'save-baseline': true
                        }
                    }
                );
                assert.equal(config.verbose, true);
                assert.equal(config.instrumentation.compact(), false);
                assert.equal(config.instrumentation.saveBaseline(), true);
                reset();
            });
        });
        describe('at both levels', () => {
            it('uses overrides', () => {
                config = configuration.loadObject(
                    {
                        verbose: true,
                        instrumentation: {
                            compact: false,
                            'save-baseline': true
                        }
                    },
                    {
                        verbose: false,
                        instrumentation: {
                            compact: true,
                            'save-baseline': false
                        }
                    }
                );
                assert.equal(config.verbose, false);
                assert.equal(config.instrumentation.compact(), true);
                assert.equal(config.instrumentation.saveBaseline(), false);
                reset();
            });
        });
        describe('deeper in the tree', () => {
            config = configuration.loadObject({
                check: {
                    global: {
                        statements: 80
                    }
                }
            });
            assert.equal(config.check.global.statements, 80);
            reset();
        });
    });
    describe('excludes array', () => {
        it('honors default excludes when set', () => {
            config = configuration.loadObject({
                instrumentation: {
                    excludes: ['**/vendor/**']
                }
            });
            const iOpts = config.instrumentation;
            assert.deepEqual(iOpts.excludes(), [
                '**/node_modules/**',
                '**/vendor/**'
            ]);
            assert.deepEqual(iOpts.excludes(true), [
                '**/node_modules/**',
                '**/test/**',
                '**/tests/**',
                '**/vendor/**'
            ]);
            reset();
        });
        it('honors default excludes when not set', () => {
            config = configuration.loadObject({
                instrumentation: {
                    'default-excludes': null,
                    excludes: ['**/vendor/**']
                }
            });
            const iOpts = config.instrumentation;
            assert.deepEqual(iOpts.excludes(), ['**/vendor/**']);
            assert.deepEqual(iOpts.excludes(true), ['**/vendor/**']);
            reset();
        });
        it('returns nothing when defaults off and no excludes', () => {
            config = configuration.loadObject({
                instrumentation: {
                    'default-excludes': null
                }
            });
            const iOpts = config.instrumentation;
            assert.deepEqual(iOpts.excludes(), []);
            assert.deepEqual(iOpts.excludes(true), []);
            reset();
        });
    });
    describe('file loading', () => {
        it('fails on bad config file', () => {
            assert.throws(() =>
                configuration.loadFile('/a/non/existent/path.js')
            );
            reset();
        });
        it('uses default config when no default file found', () => {
            config = configuration.loadFile();
            const defaultConfig = configuration.loadObject();
            assert.deepEqual(defaultConfig, config);
            reset();
        });
        describe('when files present', () => {
            beforeEach(() => {
                process.chdir(newCwd);
            });
            afterEach(() => {
                process.chdir(oldCwd);
            });
            it('uses default YAML config when not explicit', () => {
                config = configuration.loadFile(undefined, { verbose: true });
                assert.equal(config.instrumentation.compact(), false);
                assert.deepEqual(config.reporting.reports(), [
                    'lcov',
                    'cobertura'
                ]);
                reset();
            });
            it('uses explicit file when provided', () => {
                config = configuration.loadFile('cfg.json', { verbose: true });
                assert.equal(config.instrumentation.compact(), true);
                assert.deepEqual(config.reporting.reports(), ['lcov']);
                assert.equal(config.instrumentation.saveBaseline(), true);
                assert.equal(config.hooks.postRequireHook(), 'yui-istanbul');
                reset();
            });
        });
    });
    describe('custom watermarks', () => {
        it('loads from sparse config', () => {
            config = configuration.loadObject({
                reporting: { watermarks: { statements: [10, 90] } }
            });
            const w = config.reporting.watermarks();
            assert.deepEqual(w.statements, [10, 90]);
            assert.deepEqual(w.branches, [50, 80]);
            assert.deepEqual(w.functions, [50, 80]);
            assert.deepEqual(w.lines, [50, 80]);
            reset();
        });
        it('does not load any junk config', () => {
            config = configuration.loadObject({
                reporting: {
                    watermarks: {
                        statements: [10, 90, 95],
                        branches: [-10, 70],
                        lines: [70, 110],
                        functions: ['a', 10]
                    }
                }
            });
            const w = config.reporting.watermarks();
            assert.deepEqual(w.statements, [50, 80]);
            assert.deepEqual(w.branches, [50, 80]);
            assert.deepEqual(w.functions, [50, 80]);
            assert.deepEqual(w.lines, [50, 80]);
            reset();
        });
    });
});
