/* globals describe, it, beforeEach, afterEach */

const path = require('path');
const fs = require('fs');
const assert = require('chai').assert;
const mkdirp = require('make-dir');
const rimraf = require('rimraf');
const codeRoot = path.resolve(__dirname, 'sample-code');
const outputDir = path.resolve(__dirname, 'coverage');
const configuration = require('../lib/config');
const cover = require('../lib/run-cover');
const hijack = require('./hijack-streams');
const wrap = hijack.wrap;
let unhookFn;

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
        const cfg = configuration.loadObject(
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
        const config = getConfig({
            verbose: true,
            instrumentation: { 'include-all-sources': false }
        });
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            const fn = data.coverageFn;
            const hookFn = data.hookFn;
            const exitFn = data.exitFn;
            unhookFn = data.unhookFn;
            assert.isFunction(fn);
            assert.isFunction(unhookFn);
            assert.isFunction(hookFn);
            assert.isFunction(exitFn);
            hookFn();
            require('./sample-code/foo');
            const coverageMap = fn();
            assert.ok(coverageMap);
            const coverage = coverageMap[path.resolve(codeRoot, 'foo.js')];
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
            const otherMap = JSON.parse(
                fs.readFileSync(path.resolve(outputDir, 'coverage.raw.json'))
            );
            assert.deepEqual(otherMap, coverageMap);
            cb();
        });
    });

    it('hooks runInContext and provides coverage', cb => {
        cb = wrap(cb);
        const config = getConfig({
            hooks: { 'hook-run-in-context': true },
            instrumentation: { 'include-all-sources': false }
        });
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            const fn = data.coverageFn;
            const exitFn = data.exitFn;
            const hookFn = data.hookFn;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/runInContext');

            const coverageMap = fn();
            assert.ok(coverageMap);

            const coverage = coverageMap[path.resolve(codeRoot, 'foo.js')];
            assert.ok(coverage);
            exitFn();
            assert.ok(
                fs.existsSync(path.resolve(outputDir, 'coverage.raw.json'))
            );
            assert.ok(fs.existsSync(path.resolve(outputDir, 'lcov.info')));
            assert.ok(fs.existsSync(path.resolve(outputDir, 'lcov-report')));

            const otherMap = JSON.parse(
                fs.readFileSync(path.resolve(outputDir, 'coverage.raw.json'))
            );
            assert.deepEqual(otherMap, coverageMap);
            cb();
        });
    });

    it('hooks runInThisContext and provides coverage', cb => {
        cb = wrap(cb);
        const config = getConfig({
            hooks: { 'hook-run-in-this-context': true },
            instrumentation: { 'include-all-sources': false }
        });
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            const fn = data.coverageFn;
            const hookFn = data.hookFn;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/context');
            const coverageMap = fn();
            assert.ok(coverageMap);
            assert.ok(coverageMap[path.resolve(codeRoot, 'context.js')]);
            assert.ok(coverageMap[path.resolve(codeRoot, 'foo.js')]);
            cb();
        });
    });

    it('includes all sources by default (ignoring bad code)', cb => {
        cb = wrap(cb);
        const config = getConfig({
            verbose: true,
            instrumentation: {
                'default-excludes': false,
                'include-all-sources': true,
                extensions: ['.js', '.xjs']
            }
        });
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            const fn = data.coverageFn;
            const hookFn = data.hookFn;
            const exitFn = data.exitFn;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/foo');
            exitFn();
            const coverageMap = fn();
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
        const config = getConfig({ instrumentation: { 'include-pid': true } });
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            const hookFn = data.hookFn;
            const exitFn = data.exitFn;
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
        const config = getConfig({
            hooks: { 'hook-run-in-this-context': true },
            instrumentation: { 'include-all-sources': false }
        });
        cover.getCoverFunctions(config, ['**/foo.js'], (err, data) => {
            assert.ok(!err);
            const fn = data.coverageFn;
            const hookFn = data.hookFn;
            const exitFn = data.exitFn;
            unhookFn = data.unhookFn;
            hookFn();
            require('./sample-code/context');
            exitFn();
            const coverageMap = fn();
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
        const config = getConfig();
        cover.getCoverFunctions(config, (err, data) => {
            assert.ok(!err);
            unhookFn = data.unhookFn;
            assert.doesNotThrow(data.exitFn);
            cb();
        });
    });

    describe('text reports', () => {
        const getTextReportConfig = function(type) {
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
            const config = getTextReportConfig();
            cover.getCoverFunctions(config, (err, data) => {
                assert.ok(!err);
                const hookFn = data.hookFn;
                const exitFn = data.exitFn;
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
            const config = getTextReportConfig('detail');
            cover.getCoverFunctions(config, (err, data) => {
                assert.ok(!err);
                const hookFn = data.hookFn;
                const exitFn = data.exitFn;
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
            const config = getTextReportConfig('both');
            cover.getCoverFunctions(config, (err, data) => {
                assert.ok(!err);
                const hookFn = data.hookFn;
                const exitFn = data.exitFn;
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
            const config = getTextReportConfig('none');
            cover.getCoverFunctions(config, (err, data) => {
                assert.ok(!err);
                const hookFn = data.hookFn;
                const exitFn = data.exitFn;
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
