/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
"use strict";

var store = require('./lib/map-store');
/**
 * @module AllExports
 */
module.exports = {
    createSourceMapStore: function (opts) {
        return store.create(opts);
    }
};


