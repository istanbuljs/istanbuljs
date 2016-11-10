/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
import * as babylon from 'babylon';
import * as t from 'babel-types';
import traverse from 'babel-traverse';
import generate from 'babel-generator';
import programVisitor from './visitor';

function defaultOpts() {
    return {
        coverageVariable: "__coverage__",
        preserveComments: false,
        compact: true,
        esModules: false,
        autoWrap: false,
        produceSourceMap: false,
        sourceMapUrlCallback: null,
        debug: false
    };
}
/**
 * Instrumenter is the public API for the instrument library.
 * It is typically used for ES5 code. For ES6 code that you
 * are already running under `babel` use the coverage plugin
 * instead.
 * @param {Object} opts optional.
 * @param {string} [opts.coverageVariable=__coverage__] name of global coverage variable.
 * @param {boolean} [opts.preserveComments=false] preserve comments in output
 * @param {boolean} [opts.compact=true] generate compact code.
 * @param {boolean} [opts.esModules=false] set to true to instrument ES6 modules.
 * @param {boolean} [opts.autoWrap=false] set to true to allow `return` statements outside of functions.
 * @param {boolean} [opts.produceSourceMap=false] set to true to produce a source map for the instrumented code.
 * @param {Function} [opts.sourceMapUrlCallback=null] a callback function that is called when a source map URL
 *     is found in the original code. This function is called with the source file name and the source map URL.
 * @param {boolean} [opts.debug=false] - turn debugging on
 */
class Instrumenter {
    constructor(opts=defaultOpts()) {
        this.opts = this.normalizeOpts(opts);
        this.fileCoverage = null;
        this.sourceMap = null;
    }
    /**
     * normalize options passed in and assign defaults.
     * @param opts
     * @private
     */
    normalizeOpts(opts) {
        const normalize = (name, defaultValue) => {
            if (!opts.hasOwnProperty(name)) {
                opts[name] = defaultValue;
            }
        };
        const defOpts = defaultOpts();
        Object.keys(defOpts).forEach(function (k) {
            normalize(k, defOpts[k]);
        });
        return opts;
    }
    /**
     * instrument the supplied code and track coverage against the supplied
     * filename. It throws if invalid code is passed to it. ES5 and ES6 syntax
     * is supported. To instrument ES6 modules, make sure that you set the
     * `esModules` property to `true` when creating the instrumenter.
     *
     * @param {string} code - the code to instrument
     * @param {string} filename - the filename against which to track coverage.
     * @param {object} [inputSourceMap] - the source map that maps the not instrumented code back to it's original form.
     * Is assigned to the coverage object and therefore, is available in the json output and can be used to remap the
     * coverage to the untranspiled source.
     * @returns {string} the instrumented code.
     */
    instrumentSync(code, filename, inputSourceMap) {
        if (typeof code !== 'string') {
            throw new Error('Code must be a string');
        }
        filename = filename || String(new Date().getTime()) + '.js';
        const opts = this.opts;
        const ast = babylon.parse(code, {
            allowReturnOutsideFunction: opts.autoWrap,
            sourceType: opts.esModules ? "module" : "script"
        });
        const ee = programVisitor(t, filename, {
            coverageVariable: opts.coverageVariable,
            inputSourceMap: inputSourceMap
        });
        let output = {};
        const visitor = {
            Program: {
                enter: ee.enter,
                exit: function (path) {
                    output = ee.exit(path);
                }
            }
        };
        traverse(ast, visitor);

        const generateOptions = {
            compact: opts.compact,
            sourceMaps: opts.produceSourceMap,
            sourceFileName: filename
        };
        const codeMap = generate(ast, generateOptions, code);
        this.fileCoverage = output.fileCoverage;
        this.sourceMap = codeMap.map;
        const cb = this.opts.sourceMapUrlCallback;
        if (cb && output.sourceMappingURL) {
            cb(filename, output.sourceMappingURL);
        }
        return codeMap.code;
    }
    /**
     * callback-style instrument method that calls back with an error
     * as opposed to throwing one. Note that in the current implementation,
     * the callback will be called in the same process tick and is not asynchronous.
     *
     * @param {string} code - the code to instrument
     * @param {string} filename - the filename against which to track coverage.
     * @param {Function} callback - the callback
     * @param {Object} inputSourceMap - the source map that maps the not instrumented code back to it's original form.
     * Is assigned to the coverage object and therefore, is available in the json output and can be used to remap the
     * coverage to the untranspiled source.
     */
    instrument(code, filename, callback, inputSourceMap) {
        if (!callback && typeof filename === 'function') {
            callback = filename;
            filename = null;
        }
        try {
            var out = this.instrumentSync(code, filename, inputSourceMap);
            callback(null, out);
        } catch (ex) {
            callback(ex);
        }
    }
    /**
     * returns the file coverage object for the last file instrumented.
     * @returns {Object} the file coverage object.
     */
    lastFileCoverage() {
        return this.fileCoverage;
    }
    /**
     * returns the source map produced for the last file instrumented.
     * @returns {null|Object} the source map object.
     */
    lastSourceMap() {
        return this.sourceMap;
    }
}

export default Instrumenter;
