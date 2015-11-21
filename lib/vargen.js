/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var crypto = require('crypto');

module.exports = function (filename) {
    var hash = crypto.createHash('md5'),
        suffix;
    hash.update(filename);
    suffix = hash.digest('base64');
    //trim trailing equal signs, turn identifier unsafe chars to safe ones + => _ and / => $
    suffix = suffix.replace(new RegExp('=', 'g'), '')
        .replace(new RegExp('\\+', 'g'), '_')
        .replace(new RegExp('/', 'g'), '$');
    return '__cov_' + suffix;
};




