/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
"use strict";

/**
 * @module AllExports
 */
var Instrumenter = require('./lib/instrumenter');

module.exports = {
    /**
     * returns an instrumenter instance with the specified options
     * @param {Object} opts [opts=undefined] instrumenter options, see {@link #Instrumenter}
     * @returns {Instrumenter}
     */
    createInstrumenter: function (opts) {
        return new Instrumenter(opts);
    }
};





