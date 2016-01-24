/*jslint nomen: true */
var Instrumenter = require('../../../lib/instrumenter'),
    FileCoverage = require('istanbul-lib-coverage').classes.FileCoverage,
    assert = require('chai').assert,
    clone = require('clone');

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
        annotated = codeArray.map(function (str) { line += 1; return pad(line, 6) + ': ' + str; });
    return annotated.join('\n');
}

function Verifier(opts) {
    var that = this;
    Object.keys(opts).forEach(function (k) {
       that[k] = opts[k];
    });
}

function getGlobalObject() {
    /*jshint evil: true */
    return (new Function('return this'))();
}

Verifier.prototype = {

    extractSimpleSkips: function (mapObj) {
        var ret = {};
        Object.keys(mapObj).forEach(function (k) {
            var val = mapObj[k];
            if (val.skip) {
                ret[k] = true;
            }
        });
        return ret;
    },

    extractBranchSkips: function (branchMap) {
        var ret = {};
        Object.keys(branchMap).forEach(function (k) {
            var locs = branchMap[k].locations,
                anySkip = false,
                skips = locs.map(function (l) {
                    anySkip = anySkip || l.skip;
                    return l.skip || false;
                });
            if (anySkip) {
                ret[k] = skips;
            }
        });
        return ret;
    },

    verify: function (args, expectedOutput, expectedCoverage) {

        assert.ok(!this.err, (this.err || {}).message);

        getGlobalObject()[this.coverageVariable] = clone(this.baseline);
        var actualOutput = this.fn(args),
            cov = this.getFileCoverage();

        assert.ok(cov && typeof cov === 'object', 'No coverage found for [' + this.file + ']');
        assert.deepEqual(actualOutput, expectedOutput, 'Output mismatch');
        assert.deepEqual(cov.getLineCoverage(), expectedCoverage.lines || {}, 'Line coverage mismatch');
        assert.deepEqual(cov.f, expectedCoverage.functions || {}, 'Function coverage mismatch');
        assert.deepEqual(cov.b, expectedCoverage.branches || {}, 'Branch coverage mismatch');
        assert.deepEqual(cov.s, expectedCoverage.statements || {}, 'Statement coverage mismatch');
    },

    getCoverage: function () {
        return getGlobalObject()[this.coverageVariable];
    },

    getFileCoverage: function () {
        var cov = this.getCoverage();
        return new FileCoverage(cov[Object.keys(cov)[0]]);
    },

    getGeneratedCode: function () {
        return this.generatedCode;
    }
};

function extractTestOption(opts, name, defaultValue) {
    var v = defaultValue;
    if (opts.hasOwnProperty(name)) {
        v = opts[name];
        delete opts[name];
    }
    return v;
}

function create(code, opts) {

    opts = opts || {};

    var debug = extractTestOption(opts, 'debug', process.env.DEBUG),
        file = extractTestOption(opts, 'file', __filename),
        generateOnly = extractTestOption(opts, 'generateOnly', false),
        coverageVariable = extractTestOption(opts, 'coverageVariable', '$$coverage$$'),
        instrumenter,
        instrumenterOutput,
        wrapped,
        fn,
        g = getGlobalObject(),
        verror;

    opts.debug = debug;
    opts.coverageVariable = coverageVariable;
    instrumenter = new Instrumenter(opts);
    try {
        instrumenterOutput = instrumenter.instrumentSync(code, file);
        if (debug) {
            console.log('================== Original ============================================');
            console.log(annotatedCode(code));
            console.log('================== Generated ===========================================');
            console.log(instrumenterOutput);
            console.log('========================================================================');
        }
    } catch (ex) {
        console.error(ex.stack);
        verror = new Error('Error instrumenting:\n' + annotatedCode(String(code)) + "\n" + ex.message);
    }
    if (!(verror || generateOnly)) {
        wrapped = '{ var output;\n' + instrumenterOutput + '\nreturn output;\n}';
        g[coverageVariable] = undefined;
        try {
            /*jshint evil: true */
            fn = new Function('args',wrapped);
        } catch (ex) {
            console.error(ex.stack);
            verror = new Error('Error compiling\n' + annotatedCode(code) + '\n' + ex.message);
        }
    }
    return new Verifier({
        err: verror,
        debug: debug,
        file: file,
        fn: fn,
        code: code,
        generatedCode: instrumenterOutput,
        coverageVariable: coverageVariable,
        baseline: clone(g[coverageVariable])
    });
}

module.exports = {
    create: create
};



