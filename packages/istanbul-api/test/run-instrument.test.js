/* globals describe, it, beforeEach, afterEach */

var assert = require('chai').assert,
    path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    codeRoot = path.resolve(__dirname, 'sample-code'),
    outputDir = path.resolve(__dirname, 'coverage'),
    configuration = require('../lib/config'),
    instrument = require('../lib/run-instrument'),
    ms = require('memory-streams'),
    vm = require('vm'),
    hijack = require('./hijack-streams'),
    wrap = hijack.wrap;

describe('run instrument', function () {

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

    function assertValidCode(code) {
        assert.doesNotThrow(function () {
            vm.createScript(code, 'foo.js');
        }, "Invalid code generated; logging interference perhaps?");
    }

    function outFile(f) {
        return path.resolve(outputDir, f);
    }

    beforeEach(function () {
        mkdirp.sync(outputDir);
    });

    afterEach(function () {
        rimraf.sync(outputDir);
    });

    describe('single file', function () {
        var memStream,
            origWrite;

        beforeEach(function () {
            memStream = new ms.WritableStream();
            origWrite = process.stdout.write;
            process.stdout.write = function () {
                memStream.write.apply(memStream, Array.prototype.slice.call(arguments));
            };
        });

        function reset(cb) {
            process.stdout.write = origWrite;
            cb();
        }

        afterEach(reset);
        it('works with default options for a single file', function (cb) {
            instrument.run(getConfig(), {input: path.resolve(codeRoot, 'foo.js')}, function (err) {
                assert.ok(!err);
                assertValidCode(memStream.toString());
                reset(cb);
            });
        });
        it('preserves comments in output', function (cb) {
            instrument.run(getConfig({instrumentation: {'preserve-comments': true}}),
                {input: path.resolve(codeRoot, 'foo.js')},
                function (err) {
                    assert.ok(!err);
                    assert.ok(memStream.toString().match(/call bind in mainline/));
                    assertValidCode(memStream.toString());
                    reset(cb);
                });
        });
        it('works with compact as default', function (cb) {
            instrument.run(getConfig(),
                {input: path.resolve(codeRoot, 'foo.js')},
                function (err) {
                    assert.ok(!err);
                    var pass1 = memStream.toString();
                    memStream = new ms.WritableStream();
                    instrument.run(getConfig({instrumentation: {compact: false}}),
                        {input: path.resolve(codeRoot, 'foo.js')},
                        function (err) {
                            assert.ok(!err);
                            var pass2 = memStream.toString();
                            assert.ok(pass2.length > pass1.length);
                            reset(cb);
                        });
                });
        });

        it('works with explicit output options', function (cb) {
            var outFile = path.resolve(outputDir, 'foo.js');
            instrument.run(getConfig(),
                {
                    input: path.resolve(codeRoot, 'foo.js'),
                    output: outFile
                },
                function (err) {
                    assert.ok(!err);
                    assert.ok(fs.existsSync(outFile));
                    assertValidCode(fs.readFileSync(outFile,'utf8'));
                    reset(cb);
                });
        });
    });

    describe('multiple files', function () {
        beforeEach(hijack.silent);
        afterEach(hijack.reset);

        it('instruments multiple files', function (cb) {
            cb = wrap(cb);
            instrument.run(getConfig({ verbose: true }), {input: codeRoot, output: outputDir },
                function (err) {
                    assert.ok(!err);
                    assert.ok(fs.existsSync(outFile('foo.js')));
                    assert.ok(fs.existsSync(outFile('context.js')));
                    assert.ok(!fs.existsSync(outFile('node_modules/adder.js')));
                    cb();
                });
        });
        it('saves baseline coverage when requested', function (cb) {
            cb = wrap(cb);
            instrument.run(getConfig({
                instrumentation: {
                    'save-baseline': true,
                    'baseline-file': outFile('baseline.raw.json'),
                    'default-excludes': false,
                    'excludes': [ '**/bad.js' ]
                }
            }),{input: codeRoot, output: outputDir },
                function (err) {
                    assert.ok(!err);
                    assert.ok(fs.existsSync(outFile('foo.js')));
                    assert.ok(fs.existsSync(outFile('node_modules/adder.js')));
                    assert.ok(fs.existsSync(outFile('baseline.raw.json')));
                    cb();
                });
        });
    });
    describe('negative tests', function () {
        beforeEach(hijack.silent);
        afterEach(hijack.reset);

        it('barfs on no inputs', function (cb) {
            cb = wrap(cb);
            instrument.run(getConfig(), null,
                function (err) {
                    assert.ok(err);
                    assert.equal(err.message, 'No input specified');
                    cb();
                });
        });
        it('barfs on directory coverage when output option not provided', function (cb) {
            cb = wrap(cb);
            instrument.run(getConfig(), {input: codeRoot },
                function (err) {
                    assert.ok(err);
                    assert.equal(err.message, 'Need an output directory when input is a directory!');
                    cb();
                });
        });
        it('barfs on directory coverage when output == input', function (cb) {
            cb = wrap(cb);
            instrument.run(getConfig(), {input: codeRoot, output: codeRoot },
                function (err) {
                    assert.ok(err);
                    assert.equal(err.message, 'Cannot instrument into the same directory/ file as input!');
                    cb();
                });
        });
    });
    describe('complete copy', function () {
        beforeEach(hijack.silent);
        afterEach(hijack.reset);

        it('does not copy non-JS files by default', function (cb) {
            cb = wrap(cb);
            instrument.run(getConfig(), {input: codeRoot, output: outputDir },
                function (err) {
                    assert.ok(!err);
                    assert.ok(!fs.existsSync(outFile('styles.css')));
                    cb();
                });
        });
        it('copies non-JS files when requested', function (cb) {
            cb = wrap(cb);
            instrument.run(getConfig({ instrumentation: { 'complete-copy': true }}),
                {input: codeRoot, output: outputDir },
                function (err) {
                    assert.ok(!err);
                    assert.ok(fs.existsSync(outFile('styles.css')));
                    cb();
                });
        });
    });
});
