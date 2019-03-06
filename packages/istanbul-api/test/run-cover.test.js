/* globals describe, it, beforeEach, afterEach */

var assert = require('chai').assert;
var path = require('path');
var fs = require('fs');
var mkdirp = require('make-dir');
var rimraf = require('rimraf');
var codeRoot = path.resolve(__dirname, 'sample-code');
var outputDir = path.resolve(__dirname, 'coverage');
var configuration = require('../lib/config');
var cover = require('../lib/run-cover');
var hijack = require('./hijack-streams');
var wrap = hijack.wrap;
var unhookFn;

describe('run cover', () => {
    beforeEach(() => {
        unhookFn = null;
        mkdirp.sync(outputDir);
        hijack.silent();
    });
    afterEach(() => {
        hijack.reset();
        rimraf.sync(outputDir);
        if (unhookFn) {
            unhookFn();
        }
    });

    function getConfig(overrides) {
        var cfg = configuration.loadObject(
            {
                verbose: false,
                instrumentation: {
                    root: codeRoot
                },
                reporting: {
                    dir: outputDir
                }
            },
            overrides
        );
        return cfg;
    }

    it('hooks require and provides coverage', cb => {
        cb = wrap(cb);
        var config = getConfig({
            verbose: true,
            instrumentation: { 'include-all-sources': false }
        });
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            var fn = data.coverageFn;
            var hookFn = data.hookFn;
            var exitFn = data.exitFn;
            var coverageMap;
            var coverage;
            var otherMap;
            unhookFn = data.unhookFn;
            assert.isFunction(fn);
            assert.isFunction(unhookFn);
            assert.isFunction(hookFn);
            assert.isFunction(exitFn);
            hookFn();
            require('./sample-code/foo');
            coverageMap = fn();
            assert.ok(coverageMap);
            coverage = coverageMap[path.resolve(codeRoot, 'foo.js')];
            assert.ok(coverage);
            assert.deepEqual(coverage.s, { 0: 1, 1: 0, 2: 1, 3: 1, 4: 1 });
            assert.deepEqual(coverage.f, { 0: 1, 1: 0 });
            assert.deepEqual(coverage.b, { 0: [1, 0], 1: [1, 0] });
            exitFn();
            assert.ok(
                fs.existsSync(path.resolve(outputDir, 'coverage.raw.json'))
            );
            assert.ok(fs.existsSync(path.resolve(outputDir, 'lcov.info')));
            assert.ok(fs.existsSync(path.resolve(outputDir, 'lcov-report')));
            otherMap = JSON.parse(
                fs.readFileSync(path.resolve(outputDir, 'coverage.raw.json'))
            );
            assert.deepEqual(otherMap, coverageMap);
            cb();
        });
    });

    it('hooks runInContext and provides coverage', cb => {
        cb = wrap(cb);
        var config = getConfig({
            hooks: { 'hook-run-in-context': true },
            instrumentation: { 'include-all-sources': false }
        });
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            var fn = data.coverageFn;
            var exitFn = data.exitFn;
            var hookFn = data.hookFn;
            var coverage;
            var coverageMap;
            var otherMap;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/runInContext');
            coverageMap = fn();
            assert.ok(coverageMap);
            coverage = coverageMap[path.resolve(codeRoot, 'foo.js')];
            assert.ok(coverage);
            exitFn();
            assert.ok(
                fs.existsSync(path.resolve(outputDir, 'coverage.raw.json'))
            );
            assert.ok(fs.existsSync(path.resolve(outputDir, 'lcov.info')));
            assert.ok(fs.existsSync(path.resolve(outputDir, 'lcov-report')));
            otherMap = JSON.parse(
                fs.readFileSync(path.resolve(outputDir, 'coverage.raw.json'))
            );
            assert.deepEqual(otherMap, coverageMap);
            cb();
        });
    });

    it('hooks runInThisContext and provides coverage', cb => {
        cb = wrap(cb);
        var config = getConfig({
            hooks: { 'hook-run-in-this-context': true },
            instrumentation: { 'include-all-sources': false }
        });
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            var fn = data.coverageFn;
            var hookFn = data.hookFn;
            var coverageMap;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/context');
            coverageMap = fn();
            assert.ok(coverageMap);
            assert.ok(coverageMap[path.resolve(codeRoot, 'context.js')]);
            assert.ok(coverageMap[path.resolve(codeRoot, 'foo.js')]);
            cb();
        });
    });

    it('includes all sources by default (ignoring bad code)', cb => {
        cb = wrap(cb);
        var config = getConfig({
            verbose: true,
            instrumentation: {
                'default-excludes': false,
                'include-all-sources': true,
                extensions: ['.js', '.xjs']
            }
        });
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            var fn = data.coverageFn;
            var hookFn = data.hookFn;
            var exitFn = data.exitFn;
            var coverageMap;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/foo');
            exitFn();
            coverageMap = fn();
            assert.ok(coverageMap);
            assert.ok(coverageMap[path.resolve(codeRoot, 'context.js')]);
            assert.ok(coverageMap[path.resolve(codeRoot, 'foo.js')]);
            assert.ok(
                coverageMap[path.resolve(codeRoot, 'node_modules', 'adder.js')]
            );
            cb();
        });
    });

    it('includes pid in coverage JSON when requested', cb => {
        cb = wrap(cb);
        var config = getConfig({ instrumentation: { 'include-pid': true } });
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            var hookFn = data.hookFn;
            var exitFn = data.exitFn;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/foo');
            exitFn();
            assert.ok(
                fs.existsSync(
                    path.resolve(
                        outputDir,
                        'coverage-' + process.pid + '.raw.json'
                    )
                )
            );
            cb();
        });
    });

    it('accepts specific includes', cb => {
        cb = wrap(cb);
        var config = getConfig({
            hooks: { 'hook-run-in-this-context': true },
            instrumentation: { 'include-all-sources': false }
        });
        cover.getCoverFunctions(config, ['**/foo.js'], (err, data) => {
            assert.ok(!err);
            var fn = data.coverageFn;
            var hookFn = data.hookFn;
            var exitFn = data.exitFn;
            var coverageMap;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/context');
            exitFn();
            coverageMap = fn();
            assert.ok(coverageMap);
            assert.ok(!coverageMap[path.resolve(codeRoot, 'context.js')]);
            assert.ok(coverageMap[path.resolve(codeRoot, 'foo.js')]);
            assert.ok(
                !coverageMap[path.resolve(codeRoot, 'node_modules', 'adder.js')]
            );
            cb();
        });
    });

    it('complains but does not throw when no coverage', cb => {
        cb = wrap(cb);
        var config = getConfig();
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            unhookFn = data.unhookFn;
            assert.doesNotThrow(data.exitFn);
            cb();
        });
    });

    describe('text reports', () => {
        var getTextReportConfig = function(type) {
            return getConfig({
                reporting: {
                    print: type,
                    'report-config': {
                        text: { file: 'rpt.txt' },
                        'text-summary': { file: 'summary.txt' }
                    }
                }
            });
        };
        it('prints text summary by default', cb => {
            cb = wrap(cb);
            var config = getTextReportConfig();
            cover.getCoverFunctions(config, (err, data) => {
                assert.ok(!err);
                var hookFn = data.hookFn;
                var exitFn = data.exitFn;
                unhookFn = data.unhookFn;
                hookFn();
                require('./sample-code/foo');
                exitFn();
                assert.ok(
                    fs.existsSync(path.resolve(outputDir, 'summary.txt'))
                );
                assert.ok(!fs.existsSync(path.resolve(outputDir, 'rpt.txt')));
                cb();
            });
        });
        it('prints detail only', cb => {
            cb = wrap(cb);
            var config = getTextReportConfig('detail');
            cover.getCoverFunctions(config, (err, data) => {
                assert.ok(!err);
                var hookFn = data.hookFn;
                var exitFn = data.exitFn;
                unhookFn = data.unhookFn;
                hookFn();
                require('./sample-code/foo');
                exitFn();
                assert.ok(
                    !fs.existsSync(path.resolve(outputDir, 'summary.txt'))
                );
                assert.ok(fs.existsSync(path.resolve(outputDir, 'rpt.txt')));
                cb();
            });
        });
        it('prints both', cb => {
            cb = wrap(cb);
            var config = getTextReportConfig('both');
            cover.getCoverFunctions(config, (err, data) => {
                assert.ok(!err);
                var hookFn = data.hookFn;
                var exitFn = data.exitFn;
                unhookFn = data.unhookFn;
                hookFn();
                require('./sample-code/foo');
                exitFn();
                assert.ok(
                    fs.existsSync(path.resolve(outputDir, 'summary.txt'))
                );
                assert.ok(fs.existsSync(path.resolve(outputDir, 'rpt.txt')));
                cb();
            });
        });
        it('prints nothing', cb => {
            cb = wrap(cb);
            var config = getTextReportConfig('none');
            cover.getCoverFunctions(config, (err, data) => {
                assert.ok(!err);
                var hookFn = data.hookFn;
                var exitFn = data.exitFn;
                unhookFn = data.unhookFn;
                hookFn();
                require('./sample-code/foo');
                exitFn();
                assert.ok(
                    !fs.existsSync(path.resolve(outputDir, 'summary.txt'))
                );
                assert.ok(!fs.existsSync(path.resolve(outputDir, 'rpt.txt')));
                cb();
            });
        });
    });
});
