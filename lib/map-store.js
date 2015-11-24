/*
 Copyright 2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
"use strict";

var path = require('path'),
    fs = require('fs'),
    transformer = require('./transformer'),
    converter = require('convert-source-map'),
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
 * @param sourceMapUrl - the source map URL
 */
MapStore.prototype.registerURL = function (transformedFilePath, sourceMapUrl) {
    if (sourceMapUrl.indexOf('data') === 0) {
        this.data[transformedFilePath] = converter.fromComment(sourceMapUrl);
        return;
    }
    var dir = path.dirname(transformedFilePath),
        file = path.resolve(dir, sourceMapUrl);
    this.data[transformedFilePath] = { file: file };
};
/**
 * registers a source map object with this store.
 * @param transformedFilePath - the file path for which the source map is valid
 * @param sourceMap - the source map object
 */
MapStore.prototype.registerMap = function (transformedFilePath, sourceMap) {
    this.data[transformedFilePath] = converter.fromObject(sourceMap);
};

MapStore.prototype.transformCoverage = function (coverageMap) {
    var that = this;
    return transformer.create(function (filePath) {
        if (!that.data[filePath]) {
            return null;
        }
        var obj = that.data[filePath];
        if (obj.file) {
            return new SMC(JSON.parse(fs.readFileSync(obj.file, 'utf8')));
        }
        return new SMC(obj);
    }).transform(coverageMap);
};

module.exports = {
    create: function (opts) {
        return new MapStore(opts);
    }
};
