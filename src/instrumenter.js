/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
import * as babylon from 'babylon';
import * as t from 'babel-types';
import traverse from 'babel-traverse';
import generate from 'babel-generator';
import programVisitor from './visitor';

class Instrumenter {
    constructor(opts) {
        this.opts = this.normalizeOpts(opts || {});
        this.fileCoverage = null;
        this.sourceMap = null;
    }

    normalizeOpts(opts) {
        const normalize = (name, defaultValue) => {
            if (!opts.hasOwnProperty(name)) {
                opts[name] = defaultValue;
            }
        };
        normalize('coverageVariable', '__coverage__');
        normalize('preserveComments', false);
        normalize('compact', true);
        normalize('esModules', false);
        normalize('autoWrap', false);
        normalize('produceSourceMap', false);
        normalize('sourceMapUrlCallback', null);
        normalize('debug', false);
        return opts;
    }

    instrumentSync(code, filename) {
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
            coverageVariable: opts.coverageVariable
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
            sourceMaps: opts.produceSourceMap
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

    instrument(code, filename, callback) {
        if (!callback && typeof filename === 'function') {
            callback = filename;
            filename = null;
        }
        try {
            var out = this.instrumentSync(code, filename);
            callback(null, out);
        } catch (ex) {
            callback(ex);
        }
    }
    lastFileCoverage() {
        return this.fileCoverage;
    }
    lastSourceMap() {
        return this.sourceMap;
    }
}

export default Instrumenter;
