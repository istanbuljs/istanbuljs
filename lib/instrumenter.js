/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var iFactory = require('./instrumenter-core'),
    parser = require('esprima'),
    codegen = require('escodegen'),
    vargen = require('./vargen');

module.exports = iFactory({
    parser: parser,
    codegen: codegen,
    vargen: vargen
});
