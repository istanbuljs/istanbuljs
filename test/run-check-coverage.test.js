/* globals describe, it, before, after */

var assert = require('chai').assert,
    path = require('path'),
    rimraf = require('rimraf'),
    codeRoot = path.resolve(__dirname, 'sample-code'),
    outputDir = path.resolve(__dirname, 'coverage'),
    configuration = require('../lib/config'),
    cover = require('../lib/run-cover'),
    checker = require('../lib/run-check-coverage');

describe('run instrument', function () {

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
        rimraf.sync(outputDir);
    });
    describe('global coverage', function () {
        it('fails on inadequate statement coverage', function (cb) {
            var cfg = getConfig({ check: { global: { statements: 60 } } });
            checker.run(cfg, function (err) {
                assert.ok(err);
                assert.match(err.message, /ERROR: Coverage for statements \(.+?%\) does not meet global threshold \(60%\)/);
                cb();
            });
        });
        it('fails on inadequate branch coverage', function (cb) {
            var cfg = getConfig({ check: { global: { branches: 80 } } });
            checker.run(cfg, function (err) {
                assert.ok(err);
                assert.match(err.message, /ERROR: Coverage for branches \(.+?%\) does not meet global threshold \(80%\)/);
                cb();
            });
        });
        it('fails on inadequate function coverage', function (cb) {
            var cfg = getConfig({ check: { global: { functions: 80 } } });
            checker.run(cfg, function (err) {
                assert.ok(err);
                assert.match(err.message, /ERROR: Coverage for functions \(.+?%\) does not meet global threshold \(80%\)/);
                cb();
            });
        });
        it('fails on inadequate line coverage', function (cb) {
            var cfg = getConfig({ check: { global: { lines: 80 } } });
            checker.run(cfg, function (err) {
                assert.ok(err);
                assert.match(err.message, /ERROR: Coverage for lines \(.+?%\) does not meet global threshold \(80%\)/);
                cb();
            });
        });
        it('fails with multiple reasons when multiple thresholds violated', function (cb) {
            var cfg = getConfig({ check: { global: { lines: 80, statements: 80, functions:80, branches: 80 } } });
            checker.run(cfg, function (err) {
                assert.ok(err);
                assert.match(err.message, /ERROR: Coverage for lines \(.+?%\) does not meet global threshold \(80%\)/);
                assert.match(err.message, /ERROR: Coverage for functions \(.+?%\) does not meet global threshold \(80%\)/);
                assert.match(err.message, /ERROR: Coverage for branches \(.+?%\) does not meet global threshold \(80%\)/);
                assert.match(err.message, /ERROR: Coverage for statements \(.+?%\) does not meet global threshold \(80%\)/);
                cb();
            });
        });
    });
});
