/* globals describe, it, beforeEach, afterEach */

const fs = require('fs');
const path = require('path');
const assert = require('chai').assert;
const rimraf = require('rimraf');
const configuration = require('../lib/config');
const cover = require('../lib/run-cover');
const runReports = require('../lib/run-reports');
const hijack = require('./hijack-streams');

const codeRoot = path.resolve(__dirname, 'sample-code');
const outputDir = path.resolve(__dirname, 'coverage');
const existsSync = fs.existsSync;
const wrap = hijack.wrap;

describe('run reports', () => {
    function getConfig(overrides) {
        const cfg = configuration.loadObject(
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
        const config = getConfig({
            reporting: {
                print: 'none',
                reports: ['cobertura']
            }
        });
        cover.getCoverFunctions(config, (err, data) => {
            if (err) {
                return cb(err);
            }
            const hookFn = data.hookFn;
            const exitFn = data.exitFn;
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
