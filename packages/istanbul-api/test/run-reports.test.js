/* globals describe, it, beforeEach, afterEach */

var assert = require('chai').assert,
    path = require('path'),
    rimraf = require('rimraf'),
    codeRoot = path.resolve(__dirname, 'sample-code'),
    outputDir = path.resolve(__dirname, 'coverage'),
    configuration = require('../lib/config'),
    cover = require('../lib/run-cover'),
    fs = require('fs'),
    existsSync = fs.existsSync,
    runReports = require('../lib/run-reports'),
    hijack = require('./hijack-streams'),
    wrap = hijack.wrap;

describe('run reports', function () {

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

    beforeEach(function (cb) {
        hijack.silent();
        var config = getConfig({
            reporting: {
                print: 'none',
                reports: ['cobertura']
            }
        });
        cover.getCoverFunctions(config, function (err, data) {
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

    afterEach(function () {
        hijack.reset();
        rimraf.sync(outputDir);
    });

    it('runs default reports consuming coverage file', function (cb) {
        cb = wrap(cb);
        assert.ok(existsSync(path.resolve(outputDir, 'coverage.raw.json')));
        runReports.run(null, getConfig(), function (err) {
            assert.ok(!err);
            assert.ok(existsSync(path.resolve(outputDir, 'lcov.info')));
            assert.ok(fs.readFileSync(path.resolve(outputDir, 'lcov.info'), 'utf8') !== '');
            assert.ok(existsSync(path.resolve(outputDir, 'lcov-report')));
            cb();
        });
    });

    it('respects input pattern', function (cb) {
        cb = wrap(cb);
        assert.ok(existsSync(path.resolve(outputDir, 'coverage.raw.json')));
        runReports.run(null, getConfig(), {include: '**/foobar.json'}, function (err) {
            assert.ok(!err);
            assert.ok(existsSync(path.resolve(outputDir, 'lcov.info')));
            assert.ok(fs.readFileSync(path.resolve(outputDir, 'lcov.info'), 'utf8') === '');
            cb();
        });
    });

    it('returns error on junk format', function (cb) {
        cb = wrap(cb);
        assert.ok(existsSync(path.resolve(outputDir, 'coverage.raw.json')));
        runReports.run(['foo'], getConfig({
            reporting: {
                reports: [],
                print: 'none'
            }
        }), 0, function (err) {
            assert.ok(err);
            assert.ok(err.inputError);
            cb();
        });
    });

    it('runs specific reports', function (cb) {
        cb = wrap(cb);
        assert.ok(existsSync(path.resolve(outputDir, 'coverage.raw.json')));
        runReports.run(['clover', 'text'], getConfig(), function (err) {
            assert.ok(!err);
            assert.ok(!existsSync(path.resolve(outputDir, 'lcov.info')));
            assert.ok(existsSync(path.resolve(outputDir, 'clover.xml')));
            cb();
        });
    });
});
