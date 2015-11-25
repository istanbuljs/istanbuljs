/*
 Copyright 2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
"use strict";

var path = require('path'),
    fs = require('fs'),
    transformer = require('./transformer'),
    SMC = require('source-map').SourceMapConsumer;

function MapStore(opts) {
    opts = opts || {};
    this.baseDir = opts.baseDir || null;
    this.verbose = opts.verbose || false;
    this.data = {};
}
/**
 * registers a source map URL with this store.
 * @param transformedFilePath - the file path for which the source map is valid
 * @param sourceMapUrl - the source map URL, **not** a comment
 */
MapStore.prototype.registerURL = function (transformedFilePath, sourceMapUrl) {
    var d = 'data:',
        b64 = 'base64,',
        pos;

    if (sourceMapUrl.length > d.length && sourceMapUrl.substring(0, d.length) === d) {
        pos = sourceMapUrl.indexOf(b64);
        if (pos > 0) {
            this.data[transformedFilePath] = {
                type: 'encoded',
                data: sourceMapUrl.substring(pos + b64.length)
            };
        } else {
            console.error('Unable to interpret source map URL: ', sourceMapUrl);
        }
        return;
    }
    var dir = path.dirname(transformedFilePath),
        file = path.resolve(dir, sourceMapUrl);
    this.data[transformedFilePath] = { type: 'file', data: file };
};
/**
 * registers a source map object with this store.
 * @param transformedFilePath - the file path for which the source map is valid
 * @param sourceMap - the source map object
 */
MapStore.prototype.registerMap = function (transformedFilePath, sourceMap) {
    if (sourceMap.version) {
        this.data[transformedFilePath] = { type: 'object', data: sourceMap };
    } else {
        console.error('Invalid source map object', sourceMap);
    }
};

MapStore.prototype.transformCoverage = function (coverageMap) {
    var that = this;
    return transformer.create(function (filePath) {
        try {
            if (!that.data[filePath]) {
                return null;
            }
            var d = that.data[filePath],
                obj;

            if (d.type === 'file') {
                obj = JSON.parse(fs.readFileSync(d.data, 'utf8'));
            } else if (d.type === 'encoded') {
                obj = JSON.parse(new Buffer(d.data, 'base64').toString());
            } else {
                obj = d.data;
            }
            return new SMC(obj);
        } catch (ex) {
            console.error('Error returning source map for ' + filePath);
            console.error(ex.message || ex);
            return null;
        }
    }).transform(coverageMap);
};

module.exports = {
    create: function (opts) {
        return new MapStore(opts);
    }
};
