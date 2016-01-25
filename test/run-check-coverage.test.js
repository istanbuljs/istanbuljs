/* globals describe, it, before, after, beforeEach, afterEach */

var assert = require('chai').assert,
    path = require('path'),
    rimraf = require('rimraf'),
    codeRoot = path.resolve(__dirname, 'sample-code'),
    outputDir = path.resolve(codeRoot, 'coverage'),
    configuration = require('../lib/config'),
    cover = require('../lib/run-cover'),
    checker = require('../lib/run-check-coverage'),
    hijack = require('./hijack-streams'),
    wrap = hijack.wrap;

describe('run check-coverage', function () {

    function getConfig(overrides) {
        var cfg = configuration.loadObject({
            verbose: false,
            hooks: {
                'hook-run-in-context': true
            },
            instrumentation: {
                root: codeRoot,
                'include-all-sources': true
            },
            reporting: {
                dir: outputDir
            }
        }, overrides);
        return cfg;
    }

    before(function (cb) {
        hijack.silent();
        cb = wrap(cb);
        var config = getConfig();
        cover.getCoverFunctions(config, function(err, data) {
            if (err) {
                return cb(err);
            }
            var hookFn = data.hookFn,
                exitFn = data.exitFn;
            hookFn();
            require('./sample-code/test/foo.test.js');
            exitFn();
            data.unhookFn();
            cb();
        });
    });
    after(function () {
        hijack.reset();
        rimraf.sync(outputDir);
    });

    beforeEach(hijack.silent);
    afterEach(hijack.reset);

    describe('global coverage', function () {
        it('fails on inadequate statement coverage', function (cb) {
            cb = wrap(cb);
            var cfg = getConfig({ check: { global: { statements: 60 } } });
            checker.run(cfg, function (err) {
                assert.ok(err);
                assert.match(err, /ERROR: Coverage for statements \(.+?%\) does not meet global threshold \(60%\)/);
                cb();
            });
        });
        it('fails on inadequate branch coverage', function (cb) {
            cb = wrap(cb);
            var cfg = getConfig({ check: { global: { branches: 80 } } });
            checker.run(cfg, function (err) {
                assert.ok(err);
                assert.match(err, /ERROR: Coverage for branches \(.+?%\) does not meet global threshold \(80%\)/);
                cb();
            });
        });
        it('fails on inadequate function coverage', function (cb) {
            cb = wrap(cb);
            var cfg = getConfig({ check: { global: { functions: 80 } } });
            checker.run(cfg, function (err) {
                assert.ok(err);
                assert.match(err, /ERROR: Coverage for functions \(.+?%\) does not meet global threshold \(80%\)/);
                cb();
            });
        });
        it('fails on inadequate line coverage', function (cb) {
            cb = wrap(cb);
            var cfg = getConfig({ check: { global: { lines: 80 } } });
            checker.run(cfg, function (err) {
                assert.ok(err);
                assert.match(err, /ERROR: Coverage for lines \(.+?%\) does not meet global threshold \(80%\)/);
                cb();
            });
        });
        it('fails with multiple reasons when multiple thresholds violated', function (cb) {
            cb = wrap(cb);
            var cfg = getConfig({ check: { global: { lines: 80, statements: 80, functions:80, branches: 80 } } });
            checker.run(cfg, function (err) {
                assert.ok(err);
                assert.match(err, /ERROR: Coverage for lines \(.+?%\) does not meet global threshold \(80%\)/);
                assert.match(err, /ERROR: Coverage for functions \(.+?%\) does not meet global threshold \(80%\)/);
                assert.match(err, /ERROR: Coverage for branches \(.+?%\) does not meet global threshold \(80%\)/);
                assert.match(err, /ERROR: Coverage for statements \(.+?%\) does not meet global threshold \(80%\)/);
                cb();
            });
        });
    });
});
