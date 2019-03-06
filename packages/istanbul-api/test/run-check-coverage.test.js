/* globals describe, it, before, after, beforeEach, afterEach */

var assert = require('chai').assert;
var path = require('path');
var rimraf = require('rimraf');
var codeRoot = path.resolve(__dirname, 'sample-code');
var outputDir = path.resolve(codeRoot, 'coverage');
var configuration = require('../lib/config');
var cover = require('../lib/run-cover');
var checker = require('../lib/run-check-coverage');
var hijack = require('./hijack-streams');
var wrap = hijack.wrap;

describe('run check-coverage', () => {
    function getConfig(overrides) {
        var cfg = configuration.loadObject(
            {
                verbose: false,
                instrumentation: {
                    root: codeRoot,
                    'include-all-sources': true
                },
                reporting: {
                    dir: outputDir
                }
            },
            overrides
        );
        return cfg;
    }

    before(cb => {
        hijack.silent();
        cb = wrap(cb);
        var config = getConfig();
        cover.getCoverFunctions(config, (err, data) => {
            if (err) {
                return cb(err);
            }
            var hookFn = data.hookFn;
            var exitFn = data.exitFn;
            hookFn();
            require('./sample-code/test/foo.test.js');
            exitFn();
            data.unhookFn();
            cb();
        });
    });
    after(() => {
        hijack.reset();
        rimraf.sync(outputDir);
    });

    beforeEach(hijack.silent);
    afterEach(hijack.reset);

    describe('global coverage', () => {
        it('fails on inadequate statement coverage', cb => {
            cb = wrap(cb);
            var cfg = getConfig({ check: { global: { statements: 60 } } });
            checker.run(cfg, err => {
                assert.ok(err);
                assert.match(
                    err,
                    /ERROR: Coverage for statements \(.+?%\) does not meet global threshold \(60%\)/
                );
                cb();
            });
        });
        it('fails on inadequate branch coverage', cb => {
            cb = wrap(cb);
            var cfg = getConfig({ check: { global: { branches: 80 } } });
            checker.run(cfg, err => {
                assert.ok(err);
                assert.match(
                    err,
                    /ERROR: Coverage for branches \(.+?%\) does not meet global threshold \(80%\)/
                );
                cb();
            });
        });
        it('fails on inadequate function coverage', cb => {
            cb = wrap(cb);
            var cfg = getConfig({ check: { global: { functions: 80 } } });
            checker.run(cfg, err => {
                assert.ok(err);
                assert.match(
                    err,
                    /ERROR: Coverage for functions \(.+?%\) does not meet global threshold \(80%\)/
                );
                cb();
            });
        });
        it('fails on inadequate line coverage', cb => {
            cb = wrap(cb);
            var cfg = getConfig({ check: { global: { lines: 80 } } });
            checker.run(cfg, err => {
                assert.ok(err);
                assert.match(
                    err,
                    /ERROR: Coverage for lines \(.+?%\) does not meet global threshold \(80%\)/
                );
                cb();
            });
        });
        it('fails with multiple reasons when multiple thresholds violated', cb => {
            cb = wrap(cb);
            var cfg = getConfig({
                check: {
                    global: {
                        lines: 80,
                        statements: 80,
                        functions: 80,
                        branches: 80
                    }
                }
            });
            checker.run(cfg, err => {
                assert.ok(err);
                assert.match(
                    err,
                    /ERROR: Coverage for lines \(.+?%\) does not meet global threshold \(80%\)/
                );
                assert.match(
                    err,
                    /ERROR: Coverage for functions \(.+?%\) does not meet global threshold \(80%\)/
                );
                assert.match(
                    err,
                    /ERROR: Coverage for branches \(.+?%\) does not meet global threshold \(80%\)/
                );
                assert.match(
                    err,
                    /ERROR: Coverage for statements \(.+?%\) does not meet global threshold \(80%\)/
                );
                cb();
            });
        });
    });
});
