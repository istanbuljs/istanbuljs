import Instrumenter from '../../src/instrumenter';
import {classes} from 'istanbul-lib-coverage';
import {assert} from 'chai';
import clone from 'clone';
import readInitialCoverage from '../../src/read-coverage';

var FileCoverage = classes.FileCoverage;

function pad(str, len) {
    var blanks = '                                             ';
    if (str.length >= len) {
        return str;
    }
    return blanks.substring(0, len - str.length) + str;
}

function annotatedCode(code) {
    var codeArray = code.split('\n'),
        line = 0,
        annotated = codeArray.map(function (str) {
            line += 1;
            return pad(line, 6) + ': ' + str;
        });
    return annotated.join('\n');
}

function getGlobalObject() {
    /*jshint evil: true */
    return (new Function('return this'))();
}


class Verifier {
    constructor(result) {
        this.result = result;
    }

    verify(args, expectedOutput, expectedCoverage) {
        assert.ok(!this.result.err, (this.result.err || {}).message);
        getGlobalObject()[this.result.coverageVariable] = clone(this.result.baseline);
        var actualOutput = this.result.fn(args),
            cov = this.getFileCoverage();

        assert.ok(cov && typeof cov === 'object', 'No coverage found for [' + this.result.file + ']');
        assert.deepEqual(actualOutput, expectedOutput, 'Output mismatch');
        assert.deepEqual(cov.getLineCoverage(), expectedCoverage.lines || {}, 'Line coverage mismatch');
        assert.deepEqual(cov.f, expectedCoverage.functions || {}, 'Function coverage mismatch');
        assert.deepEqual(cov.b, expectedCoverage.branches || {}, 'Branch coverage mismatch');
        assert.deepEqual(cov.s, expectedCoverage.statements || {}, 'Statement coverage mismatch');
        assert.deepEqual(cov.data.inputSourceMap, expectedCoverage.inputSourceMap || undefined, "Input source map mismatch");
        const initial = readInitialCoverage(this.getGeneratedCode());
        assert.ok(initial);
        assert.deepEqual(initial.coverageData, this.result.emptyCoverage);
        assert.ok(initial.path);
        if (this.result.file) {
            assert.equal(initial.path, this.result.file);
        }
        assert.equal(initial.gcv, this.result.coverageVariable);
        assert.ok(initial.hash);
    }

    getCoverage() {
        return getGlobalObject()[this.result.coverageVariable];
    }

    getFileCoverage() {
        var cov = this.getCoverage();
        return new FileCoverage(cov[Object.keys(cov)[0]]);
    }

    getGeneratedCode() {
        return this.result.generatedCode;
    }

    compileError() {
        return this.result.err;
    }
}

function extractTestOption(opts, name, defaultValue) {
    var v = defaultValue;
    if (opts.hasOwnProperty(name)) {
        v = opts[name];
    }
    return v;
}

function create(code, opts, instrumenterOpts, inputSourceMap) {

    opts = opts || {};
    instrumenterOpts = instrumenterOpts || {};
    instrumenterOpts.coverageVariable = instrumenterOpts.coverageVariable || '__testing_coverage__';

    var debug = extractTestOption(opts, 'debug', process.env.DEBUG==="1"),
        file = extractTestOption(opts, 'file', __filename),
        generateOnly = extractTestOption(opts, 'generateOnly', false),
        quiet = extractTestOption(opts, 'quiet', false),
        coverageVariable = instrumenterOpts.coverageVariable,
        g = getGlobalObject(),
        instrumenter,
        instrumenterOutput,
        wrapped,
        fn,
        verror;

    if (debug) {
        instrumenterOpts.compact = false;
    }
    instrumenter = new Instrumenter(instrumenterOpts);
    try {
        instrumenterOutput = instrumenter.instrumentSync(code, file, inputSourceMap);
        if (debug) {
            console.log('================== Original ============================================');
            console.log(annotatedCode(code));
            console.log('================== Generated ===========================================');
            console.log(instrumenterOutput);
            console.log('========================================================================');
        }
    } catch (ex) {
        if (!quiet) {
            console.error(ex.stack);
        }
        verror = new Error('Error instrumenting:\n' + annotatedCode(String(code)) + "\n" + ex.message);
    }
    if (!(verror || generateOnly)) {
        wrapped = '{ var output;\n' + instrumenterOutput + '\nreturn output;\n}';
        g[coverageVariable] = undefined;
        try {
            /*jshint evil: true */
            fn = new Function('args', wrapped);
        } catch (ex) {
            console.error(ex.stack);
            verror = new Error('Error compiling\n' + annotatedCode(code) + '\n' + ex.message);
        }
    }
    if (generateOnly) {
        assert.ok(!verror);
    }
    return new Verifier({
        err: verror,
        debug: debug,
        file: file,
        fn: fn,
        code: code,
        generatedCode: instrumenterOutput,
        coverageVariable: coverageVariable,
        baseline: clone(g[coverageVariable]),
        emptyCoverage: instrumenter.lastFileCoverage()
    });
}

export {create};
