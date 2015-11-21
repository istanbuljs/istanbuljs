/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
module.exports = function (/* filename */) {
    /*jshint evil: true */
    var scope = (new Function('return this'))();
    scope.__cov_seq = scope.__cov_seq || 0;
    scope.__cov_seq += 1;
    var suffix = scope.__cov_seq;
    return '__cov_' + suffix;
};
