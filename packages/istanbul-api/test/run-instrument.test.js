/* globals describe, it, beforeEach, afterEach */

const path = require('path');
const fs = require('fs');
const vm = require('vm');
const assert = require('chai').assert;
const mkdirp = require('make-dir');
const rimraf = require('rimraf');
const isWindows = require('is-windows');
const ms = require('memory-streams');
const configuration = require('../lib/config');
const instrument = require('../lib/run-instrument');
const hijack = require('./hijack-streams');

const codeRoot = path.resolve(__dirname, 'sample-code');
const outputDir = path.resolve(__dirname, 'coverage');
const wrap = hijack.wrap;

describe('run instrument', function() {
    if (isWindows()) {
        this.retries(3);
    }

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

    function assertValidCode(code) {
        assert.doesNotThrow(() => {
            vm.createScript(code, 'foo.js');
        }, 'Invalid code generated; logging interference perhaps?');
    }

    function outFile(f) {
        return path.resolve(outputDir, f);
    }

    beforeEach(() => {
        mkdirp.sync(outputDir);
    });

    afterEach(() => {
        rimraf.sync(outputDir);
    });

    describe('single file', () => {
        let memStream;
        let origWrite;

        beforeEach(() => {
            memStream = new ms.WritableStream();
            origWrite = process.stdout.write;
            process.stdout.write = function(...args) {
                memStream.write(...args);
            };
        });

        function reset(cb) {
            process.stdout.write = origWrite;
            cb();
        }

        afterEach(reset);
        it('works with default options for a single file', cb => {
            instrument.run(
                getConfig(),
                { input: path.resolve(codeRoot, 'foo.js') },
                err => {
                    assert.ok(!err);
                    assertValidCode(memStream.toString());
                    reset(cb);
                }
            );
        });
        it('preserves comments in output', cb => {
            instrument.run(
                getConfig({ instrumentation: { 'preserve-comments': true } }),
                { input: path.resolve(codeRoot, 'foo.js') },
                err => {
                    assert.ok(!err);
                    assert.ok(
                        memStream.toString().match(/call bind in mainline/)
                    );
                    assertValidCode(memStream.toString());
                    reset(cb);
                }
            );
        });
        it('works with compact as default', cb => {
            instrument.run(
                getConfig(),
                { input: path.resolve(codeRoot, 'foo.js') },
                err => {
                    assert.ok(!err);
                    const pass1 = memStream.toString();
                    memStream = new ms.WritableStream();
                    instrument.run(
                        getConfig({ instrumentation: { compact: false } }),
                        { input: path.resolve(codeRoot, 'foo.js') },
                        err => {
                            assert.ok(!err);
                            const pass2 = memStream.toString();
                            assert.ok(pass2.length > pass1.length);
                            reset(cb);
                        }
                    );
                }
            );
        });

        it('works with explicit output options', function(cb) {
            if (isWindows()) {
                return this.skip();
            }

            const outFile = path.resolve(outputDir, 'foo.js');
            instrument.run(
                getConfig(),
                {
                    input: path.resolve(codeRoot, 'foo.js'),
                    output: outFile
                },
                err => {
                    assert.ok(!err);
                    assert.ok(fs.existsSync(outFile));
                    assertValidCode(fs.readFileSync(outFile, 'utf8'));
                    reset(cb);
                }
            );
        });
    });

    describe('multiple files', () => {
        beforeEach(hijack.silent);
        afterEach(hijack.reset);

        it('instruments multiple files', cb => {
            cb = wrap(cb);
            instrument.run(
                getConfig({ verbose: true }),
                { input: codeRoot, output: outputDir },
                err => {
                    assert.ok(!err);
                    assert.ok(fs.existsSync(outFile('foo.js')));
                    assert.ok(fs.existsSync(outFile('context.js')));
                    assert.ok(!fs.existsSync(outFile('node_modules/adder.js')));
                    cb();
                }
            );
        });
        it('saves baseline coverage when requested', cb => {
            cb = wrap(cb);
            instrument.run(
                getConfig({
                    instrumentation: {
                        'save-baseline': true,
                        'baseline-file': outFile('baseline.raw.json'),
                        'default-excludes': false,
                        excludes: ['**/bad.js']
                    }
                }),
                { input: codeRoot, output: outputDir },
                err => {
                    assert.ok(!err);
                    assert.ok(fs.existsSync(outFile('foo.js')));
                    assert.ok(fs.existsSync(outFile('node_modules/adder.js')));
                    assert.ok(fs.existsSync(outFile('baseline.raw.json')));
                    cb();
                }
            );
        });
    });
    describe('negative tests', () => {
        beforeEach(hijack.silent);
        afterEach(hijack.reset);

        it('barfs on no inputs', cb => {
            cb = wrap(cb);
            instrument.run(getConfig(), null, err => {
                assert.ok(err);
                assert.equal(err.message, 'No input specified');
                cb();
            });
        });
        it('barfs on directory coverage when output option not provided', cb => {
            cb = wrap(cb);
            instrument.run(getConfig(), { input: codeRoot }, err => {
                assert.ok(err);
                assert.equal(
                    err.message,
                    'Need an output directory when input is a directory!'
                );
                cb();
            });
        });
        it('barfs on directory coverage when output == input', cb => {
            cb = wrap(cb);
            instrument.run(
                getConfig(),
                { input: codeRoot, output: codeRoot },
                err => {
                    assert.ok(err);
                    assert.equal(
                        err.message,
                        'Cannot instrument into the same directory/ file as input!'
                    );
                    cb();
                }
            );
        });
    });
    describe('complete copy', () => {
        beforeEach(hijack.silent);
        afterEach(hijack.reset);

        it('does not copy non-JS files by default', cb => {
            cb = wrap(cb);
            instrument.run(
                getConfig(),
                { input: codeRoot, output: outputDir },
                err => {
                    assert.ok(!err);
                    assert.ok(!fs.existsSync(outFile('styles.css')));
                    cb();
                }
            );
        });
        it('copies non-JS files when requested', cb => {
            cb = wrap(cb);
            instrument.run(
                getConfig({ instrumentation: { 'complete-copy': true } }),
                { input: codeRoot, output: outputDir },
                err => {
                    assert.ok(!err);
                    assert.ok(fs.existsSync(outFile('styles.css')));
                    cb();
                }
            );
        });
    });
});
