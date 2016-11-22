/* globals describe, it, beforeEach, afterEach */

var assert = require('chai').assert,
    path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    codeRoot = path.resolve(__dirname, 'sample-code'),
    outputDir = path.resolve(__dirname, 'coverage'),
    configuration = require('../lib/config'),
    cover = require('../lib/run-cover'),
    hijack = require('./hijack-streams'),
    wrap = hijack.wrap,
    unhookFn;

describe('run cover', function () {

    beforeEach(function () {
        unhookFn = null;
        mkdirp.sync(outputDir);
        hijack.silent();
    });
    afterEach(function () {
        hijack.reset();
        rimraf.sync(outputDir);
        if (unhookFn) {
            unhookFn();
        }
    });

    function getConfig(overrides) {
        var cfg = configuration.loadObject({
            verbose: false,
            instrumentation: {
                root: codeRoot
            },
            reporting: {
                dir: outputDir
            }
        }, overrides);
        return cfg;
    }

    it('hooks require and provides coverage', function (cb) {
        cb = wrap(cb);
        var config = getConfig({ verbose: true, instrumentation: { 'include-all-sources': false }});
        cover.getCoverFunctions(config, function(err, data) {
            assert.ok(!err);
            var fn = data.coverageFn,
                hookFn = data.hookFn,
                exitFn = data.exitFn,
                coverageMap,
                coverage,
                otherMap;
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
            assert.deepEqual(coverage.s, { 0:1, 1:0, 2:1, 3:1, 4:1 });
            assert.deepEqual(coverage.f, { 0:1, 1:0 });
            assert.deepEqual(coverage.b, { 0: [1 ,0], 1: [1,0] });
            exitFn();
            assert.ok(fs.existsSync(path.resolve(outputDir, 'coverage.raw.json')));
            assert.ok(fs.existsSync(path.resolve(outputDir, 'lcov.info')));
            assert.ok(fs.existsSync(path.resolve(outputDir, 'lcov-report')));
            otherMap = JSON.parse(fs.readFileSync(path.resolve(outputDir, 'coverage.raw.json')));
            assert.deepEqual(otherMap, coverageMap);
            cb();
        });
    });

    it('hooks runInThisContext and provides coverage', function (cb) {
        cb = wrap(cb);
        var config = getConfig({
            hooks: { 'hook-run-in-context': true },
            instrumentation: { 'include-all-sources': false }
        });
        cover.getCoverFunctions(config, function(err, data) {
            assert.ok(!err);
            var fn = data.coverageFn,
                hookFn = data.hookFn,
                coverageMap;
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

    it('includes all sources by default (ignoring bad code)', function (cb) {
        cb = wrap(cb);
        var config = getConfig({
            verbose: true,
            instrumentation: {
                'default-excludes': false,
                'include-all-sources': true,
                extensions: [ '.js', '.xjs' ]
            }
        });
        cover.getCoverFunctions(config, function(err, data) {
            assert.ok(!err);
            var fn = data.coverageFn,
                hookFn = data.hookFn,
                exitFn = data.exitFn,
                coverageMap;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/foo');
            exitFn();
            coverageMap = fn();
            assert.ok(coverageMap);
            assert.ok(coverageMap[path.resolve(codeRoot, 'context.js')]);
            assert.ok(coverageMap[path.resolve(codeRoot, 'foo.js')]);
            assert.ok(coverageMap[path.resolve(codeRoot, 'node_modules', 'adder.js')]);
            cb();
        });
    });

    it('includes pid in coverage JSON when requested', function (cb) {
        cb = wrap(cb);
        var config = getConfig({ instrumentation: { 'include-pid': true }});
        cover.getCoverFunctions(config, function(err, data) {
            assert.ok(!err);
            var hookFn = data.hookFn,
                exitFn = data.exitFn;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/foo');
            exitFn();
            assert.ok(fs.existsSync(path.resolve(outputDir, 'coverage-' + process.pid + '.raw.json')));
            cb();
        });
    });

    it('accepts specific includes', function (cb) {
        cb = wrap(cb);
        var config = getConfig({
            hooks: { 'hook-run-in-context': true },
            instrumentation: { 'include-all-sources': false }
        });
        cover.getCoverFunctions(config, [ '**/foo.js' ], function (err, data) {
            assert.ok(!err);
            var fn = data.coverageFn,
                hookFn = data.hookFn,
                exitFn = data.exitFn,
                coverageMap;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/context');
            exitFn();
            coverageMap = fn();
            assert.ok(coverageMap);
            assert.ok(!coverageMap[path.resolve(codeRoot, 'context.js')]);
            assert.ok(coverageMap[path.resolve(codeRoot, 'foo.js')]);
            assert.ok(!coverageMap[path.resolve(codeRoot, 'node_modules', 'adder.js')]);
            cb();
        });
    });

    it('complains but does not throw when no coverage', function (cb) {
        cb = wrap(cb);
        var config = getConfig();
        cover.getCoverFunctions(config, function(err, data) {
            assert.ok(!err);
            unhookFn = data.unhookFn;
            assert.doesNotThrow(data.exitFn);
            cb();
        });
    });

    describe('text reports', function () {
        var getTextReportConfig = function (type) {
            return getConfig({
                reporting: {
                    print: type,
                    'report-config': {
                        text: { file: 'rpt.txt'},
                        'text-summary': { file: 'summary.txt'}
                    }
                }
            });
        };
        it('prints text summary by default', function (cb) {
            cb = wrap(cb);
            var config = getTextReportConfig();
            cover.getCoverFunctions(config, function(err, data) {
                assert.ok(!err);
                var hookFn = data.hookFn,
                    exitFn = data.exitFn;
                unhookFn = data.unhookFn;
                hookFn();
                require('./sample-code/foo');
                exitFn();
                assert.ok(fs.existsSync(path.resolve(outputDir, 'summary.txt')));
                assert.ok(!fs.existsSync(path.resolve(outputDir, 'rpt.txt')));
                cb();
            });
        });
        it('prints detail only', function (cb) {
            cb = wrap(cb);
            var config = getTextReportConfig('detail');
            cover.getCoverFunctions(config, function(err, data) {
                assert.ok(!err);
                var hookFn = data.hookFn,
                    exitFn = data.exitFn;
                unhookFn = data.unhookFn;
                hookFn();
                require('./sample-code/foo');
                exitFn();
                assert.ok(!fs.existsSync(path.resolve(outputDir, 'summary.txt')));
                assert.ok(fs.existsSync(path.resolve(outputDir, 'rpt.txt')));
                cb();
            });
        });
        it('prints both', function (cb) {
            cb = wrap(cb);
            var config = getTextReportConfig('both');
            cover.getCoverFunctions(config, function(err, data) {
                assert.ok(!err);
                var hookFn = data.hookFn,
                    exitFn = data.exitFn;
                unhookFn = data.unhookFn;
                hookFn();
                require('./sample-code/foo');
                exitFn();
                assert.ok(fs.existsSync(path.resolve(outputDir, 'summary.txt')));
                assert.ok(fs.existsSync(path.resolve(outputDir, 'rpt.txt')));
                cb();
            });
        });
        it('prints nothing', function (cb) {
            cb = wrap(cb);
            var config = getTextReportConfig('none');
            cover.getCoverFunctions(config, function(err, data) {
                assert.ok(!err);
                var hookFn = data.hookFn,
                    exitFn = data.exitFn;
                unhookFn = data.unhookFn;
                hookFn();
                require('./sample-code/foo');
                exitFn();
                assert.ok(!fs.existsSync(path.resolve(outputDir, 'summary.txt')));
                assert.ok(!fs.existsSync(path.resolve(outputDir, 'rpt.txt')));
                cb();
            });
        });
    });
});
