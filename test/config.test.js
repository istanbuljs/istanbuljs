/* globals describe, it, beforeEach, afterEach */

var assert = require('chai').assert,
    path = require('path'),
    configuration = require('../lib/config'),
    oldCwd = process.cwd(),
    newCwd = path.resolve(__dirname, 'config-data'),
    config,
    hijack = require('./hijack-streams'),
    reset = hijack.reset;

describe('config', function () {
    beforeEach(hijack.silent);
    afterEach(reset);

    describe('no explicit config', function () {
        beforeEach(function () {
            config = configuration.loadObject(null);
        });

        it('sets verbose option', function () {
            assert.equal(config.verbose, false);
            reset();
        });
        it('sets sane instrument options', function () {
            var iOpts = config.instrumentation;
            assert.equal(iOpts.root(), process.cwd());
            assert.equal(iOpts.defaultExcludes(), true);
            assert.equal(iOpts.variable(), '__coverage__');
            assert.equal(iOpts.compact(), true);
            assert.equal(iOpts.preserveComments(), false);
            assert.equal(iOpts.completeCopy(), false);
            assert.equal(iOpts.saveBaseline(), false);
            assert.equal(iOpts.includeAllSources(), false);
            assert.equal(iOpts.baselineFile(), './coverage/coverage-baseline.raw.json');
            assert.deepEqual(iOpts.excludes(), ['**/node_modules/**']);
            assert.deepEqual(iOpts.excludes(true), ['**/node_modules/**', '**/test/**', '**/tests/**']);
            reset();
        });
        it('sets correct reporting options', function () {
            var rOpts = config.reporting;
            assert.equal(rOpts.print(), 'summary');
            assert.deepEqual(rOpts.reports(), ['lcov']);
            assert.equal(rOpts.dir(), './coverage');
            reset();
        });
        it('sets correct hook options', function () {
            var hOpts = config.hooks;
            assert.equal(hOpts.hookRunInContext(), false);
            assert.equal(hOpts.postRequireHook(), null);
            reset();
        });
    });
    describe('when overrides passed in', function () {
        describe('as initial object', function () {
            it('uses overrides', function () {
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
        describe('as override object', function () {
            it('uses overrides', function () {
                config = configuration.loadObject({},
                    {
                        verbose: true,
                        instrumentation: {compact: false, 'save-baseline': true}
                    }
                );
                assert.equal(config.verbose, true);
                assert.equal(config.instrumentation.compact(), false);
                assert.equal(config.instrumentation.saveBaseline(), true);
                reset();
            });
        });
        describe('at both levels', function () {
            it('uses overrides', function () {
                config = configuration.loadObject(
                    {
                        verbose: true,
                        instrumentation: {compact: false, 'save-baseline': true}
                    },
                    {
                        verbose: false,
                        instrumentation: {compact: true, 'save-baseline': false}
                    }
                );
                assert.equal(config.verbose, false);
                assert.equal(config.instrumentation.compact(), true);
                assert.equal(config.instrumentation.saveBaseline(), false);
                reset();
            });
        });
        describe('deeper in the tree', function () {
            config = configuration.loadObject({
                check: {
                    'global': {
                        'statements': 80
                    }
                }
            });
            assert.equal(config.check.global.statements, 80);
            reset();
        });
    });
    describe('excludes array', function () {
        it('honors default excludes when set', function () {
            config = configuration.loadObject({
                instrumentation: {
                    "excludes": ['**/vendor/**']
                }
            });
            var iOpts = config.instrumentation;
            assert.deepEqual(iOpts.excludes(), ['**/node_modules/**', '**/vendor/**']);
            assert.deepEqual(iOpts.excludes(true), ['**/node_modules/**', '**/test/**', '**/tests/**', '**/vendor/**']);
            reset();
        });
        it('honors default excludes when not set', function () {
            config = configuration.loadObject({
                instrumentation: {
                    "default-excludes": null,
                    "excludes": ['**/vendor/**']
                }
            });
            var iOpts = config.instrumentation;
            assert.deepEqual(iOpts.excludes(), ['**/vendor/**']);
            assert.deepEqual(iOpts.excludes(true), ['**/vendor/**']);
            reset();
        });
        it('returns nothing when defaults off and no excludes', function () {
            config = configuration.loadObject({
                instrumentation: {
                    "default-excludes": null
                }
            });
            var iOpts = config.instrumentation;
            assert.deepEqual(iOpts.excludes(), []);
            assert.deepEqual(iOpts.excludes(true), []);
            reset();
        });
    });
    describe("file loading", function () {
        it('fails on bad config file', function () {
            assert.throws(function () {
                return configuration.loadFile('/a/non/existent/path.js');
            });
            reset();
        });
        it('uses default config when no default file found', function () {
            config = configuration.loadFile();
            var defaultConfig = configuration.loadObject();
            assert.deepEqual(defaultConfig, config);
            reset();
        });
        describe('when files present', function () {
            beforeEach(function () {
                process.chdir(newCwd);
            });
            afterEach(function () {
                process.chdir(oldCwd);
            });
            it('uses default YAML config when not explicit', function () {
                config = configuration.loadFile(undefined, {verbose: true});
                assert.equal(config.instrumentation.compact(), false);
                assert.deepEqual(config.reporting.reports(), ['lcov', 'cobertura']);
                reset();
            });
            it('uses explicit file when provided', function () {
                config = configuration.loadFile('cfg.json', {verbose: true});
                assert.equal(config.instrumentation.compact(), true);
                assert.deepEqual(config.reporting.reports(), ['lcov']);
                assert.equal(config.instrumentation.saveBaseline(), true);
                assert.equal(config.hooks.postRequireHook(), 'yui-istanbul');
                reset();
            });
        });
    });
    describe('custom watermarks', function () {
        it('loads from sparse config', function () {
            config = configuration.loadObject({reporting: {watermarks: {statements: [10, 90]}}});
            var w = config.reporting.watermarks();
            assert.deepEqual(w.statements, [10, 90]);
            assert.deepEqual(w.branches, [50, 80]);
            assert.deepEqual(w.functions, [50, 80]);
            assert.deepEqual(w.lines, [50, 80]);
            reset();
        });
        it('does not load any junk config', function () {
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
            var w = config.reporting.watermarks();
            assert.deepEqual(w.statements, [50, 80]);
            assert.deepEqual(w.branches, [50, 80]);
            assert.deepEqual(w.functions, [50, 80]);
            assert.deepEqual(w.lines, [50, 80]);
            reset();
        });
    });
});
