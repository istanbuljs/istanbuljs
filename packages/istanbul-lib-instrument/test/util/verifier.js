import { classes } from 'istanbul-lib-coverage';
import { assert } from 'chai';
import clone from 'clone';
import Instrumenter from '../../src/instrumenter';
import readInitialCoverage from '../../src/read-coverage';

const FileCoverage = classes.FileCoverage;

function pad(str, len) {
    const blanks = '                                             ';
    if (str.length >= len) {
        return str;
    }
    return blanks.substring(0, len - str.length) + str;
}

function annotatedCode(code) {
    const codeArray = code.split('\n');
    let line = 0;
    const annotated = codeArray.map(str => {
        line += 1;
        return pad(line, 6) + ': ' + str;
    });
    return annotated.join('\n');
}

function getGlobalObject() {
    return new Function('return this')();
}

class Verifier {
    constructor(result) {
        this.result = result;
    }

    verify(args, expectedOutput, expectedCoverage) {
        assert.ok(!this.result.err, (this.result.err || {}).message);
        getGlobalObject()[this.result.coverageVariable] = clone(
            this.result.baseline
        );
        const actualOutput = this.result.fn(args);
        const cov = this.getFileCoverage();

        assert.ok(
            cov && typeof cov === 'object',
            'No coverage found for [' + this.result.file + ']'
        );
        assert.deepEqual(actualOutput, expectedOutput, 'Output mismatch');
        assert.deepEqual(
            cov.getLineCoverage(),
            expectedCoverage.lines || {},
            'Line coverage mismatch'
        );
        assert.deepEqual(
            cov.f,
            expectedCoverage.functions || {},
            'Function coverage mismatch'
        );
        assert.deepEqual(
            cov.b,
            expectedCoverage.branches || {},
            'Branch coverage mismatch'
        );
        assert.deepEqual(
            cov.s,
            expectedCoverage.statements || {},
            'Statement coverage mismatch'
        );
        assert.deepEqual(
            cov.data.inputSourceMap,
            expectedCoverage.inputSourceMap || undefined,
            'Input source map mismatch'
        );
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
        const cov = this.getCoverage();
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
    let v = defaultValue;
    if (Object.prototype.hasOwnProperty.call(opts, name)) {
        v = opts[name];
    }
    return v;
}

function create(code, opts, instrumenterOpts, inputSourceMap) {
    opts = opts || {};
    instrumenterOpts = instrumenterOpts || {};
    instrumenterOpts.coverageVariable =
        instrumenterOpts.coverageVariable || '__testing_coverage__';

    const debug = extractTestOption(opts, 'debug', process.env.DEBUG === '1');
    const file = extractTestOption(opts, 'file', __filename);
    const generateOnly = extractTestOption(opts, 'generateOnly', false);
    const noCoverage = extractTestOption(opts, 'noCoverage', false);
    const quiet = extractTestOption(opts, 'quiet', false);
    const coverageVariable = instrumenterOpts.coverageVariable;
    const g = getGlobalObject();
    let instrumenterOutput;
    let wrapped;
    let fn;
    let verror;

    if (debug) {
        instrumenterOpts.compact = false;
    }
    const instrumenter = new Instrumenter(instrumenterOpts);
    try {
        instrumenterOutput = instrumenter.instrumentSync(
            code,
            file,
            inputSourceMap
        );
        if (debug) {
            console.log(
                '================== Original ============================================'
            );
            console.log(annotatedCode(code));
            console.log(
                '================== Generated ==========================================='
            );
            console.log(instrumenterOutput);
            console.log(
                '========================================================================'
            );
        }
    } catch (ex) {
        if (!quiet) {
            console.error(ex.stack);
        }
        verror = new Error(
            'Error instrumenting:\n' +
                annotatedCode(String(code)) +
                '\n' +
                ex.message
        );
    }
    if (!(verror || generateOnly)) {
        wrapped =
            '{ var output;\n' + instrumenterOutput + '\nreturn output;\n}';
        g[coverageVariable] = undefined;
        try {
            fn = new Function('args', wrapped);
        } catch (ex) {
            console.error(ex.stack);
            verror = new Error(
                'Error compiling\n' + annotatedCode(code) + '\n' + ex.message
            );
        }
    }
    if (generateOnly || noCoverage) {
        assert.ok(!verror);
    }
    return new Verifier({
        err: verror,
        debug,
        file,
        fn,
        code,
        generatedCode: instrumenterOutput,
        coverageVariable,
        baseline: clone(g[coverageVariable]),
        emptyCoverage: instrumenter.lastFileCoverage()
    });
}

export { create };
