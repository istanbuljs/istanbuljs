/* globals describe, it, beforeEach, afterEach */

var assert = require('chai').assert;
var path = require('path');
var rimraf = require('rimraf');
var codeRoot = path.resolve(__dirname, 'sample-code');
var outputDir = path.resolve(__dirname, 'coverage');
var configuration = require('../lib/config');
var cover = require('../lib/run-cover');
var fs = require('fs');
var existsSync = fs.existsSync;
var runReports = require('../lib/run-reports');
var hijack = require('./hijack-streams');
var wrap = hijack.wrap;

describe('run reports', () => {
    function getConfig(overrides) {
        var cfg = configuration.loadObject(
            {
                verbose: false,
                hooks: {
                    'hook-run-in-this-context': true
                },
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

    beforeEach(cb => {
        hijack.silent();
        var config = getConfig({
            reporting: {
                print: 'none',
                reports: ['cobertura']
            }
        });
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

    afterEach(() => {
        hijack.reset();
        rimraf.sync(outputDir);
    });

    it('runs default reports consuming coverage file', cb => {
        cb = wrap(cb);
        assert.ok(existsSync(path.resolve(outputDir, 'coverage.raw.json')));
        runReports.run(null, getConfig(), err => {
            assert.ok(!err);
            assert.ok(existsSync(path.resolve(outputDir, 'lcov.info')));
            assert.ok(
                fs.readFileSync(
                    path.resolve(outputDir, 'lcov.info'),
                    'utf8'
                ) !== ''
            );
            assert.ok(existsSync(path.resolve(outputDir, 'lcov-report')));
            cb();
        });
    });

    it('respects input pattern', cb => {
        cb = wrap(cb);
        assert.ok(existsSync(path.resolve(outputDir, 'coverage.raw.json')));
        runReports.run(
            null,
            getConfig(),
            { include: '**/foobar.json' },
            err => {
                assert.ok(!err);
                assert.ok(existsSync(path.resolve(outputDir, 'lcov.info')));
                assert.ok(
                    fs.readFileSync(
                        path.resolve(outputDir, 'lcov.info'),
                        'utf8'
                    ) === ''
                );
                cb();
            }
        );
    });

    it('returns error on junk format', cb => {
        cb = wrap(cb);
        assert.ok(existsSync(path.resolve(outputDir, 'coverage.raw.json')));
        runReports.run(
            ['foo'],
            getConfig({
                reporting: {
                    reports: [],
                    print: 'none'
                }
            }),
            0,
            err => {
                assert.ok(err);
                assert.ok(err.inputError);
                cb();
            }
        );
    });

    it('runs specific reports', cb => {
        cb = wrap(cb);
        assert.ok(existsSync(path.resolve(outputDir, 'coverage.raw.json')));
        runReports.run(['clover', 'text'], getConfig(), err => {
            assert.ok(!err);
            assert.ok(!existsSync(path.resolve(outputDir, 'lcov.info')));
            assert.ok(existsSync(path.resolve(outputDir, 'clover.xml')));
            cb();
        });
    });
});
