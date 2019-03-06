/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var async = require('async');
var fileset = require('fileset');
var fs = require('fs');
var path = require('path');
var seq = 0;

function filesFor(options, callback) {
    if (!callback && typeof options === 'function') {
        callback = options;
        options = null;
    }
    options = options || {};

    var root = options.root;
    var includes = options.includes;
    var excludes = options.excludes;
    var realpath = options.realpath;
    var relative = options.relative;
    var opts;

    root = root || process.cwd();
    includes = includes && Array.isArray(includes) ? includes : ['**/*.js'];
    excludes =
        excludes && Array.isArray(excludes) ? excludes : ['**/node_modules/**'];

    opts = { cwd: root, nodir: true, ignore: excludes };
    seq += 1;
    opts['x' + seq + new Date().getTime()] = true; //cache buster for minimatch cache bug
    fileset(includes.join(' '), excludes.join(' '), opts, (err, files) => {
        /* istanbul ignore if - untestable */
        if (err) {
            return callback(err);
        }
        if (relative) {
            return callback(err, files);
        }

        if (!realpath) {
            files = files.map(file => path.resolve(root, file));
            return callback(err, files);
        }

        var realPathCache =
            module.constructor._realpathCache || /* istanbul ignore next */ {};

        async.map(
            files,
            (file, done) => {
                fs.realpath(path.resolve(root, file), realPathCache, done);
            },
            callback
        );
    });
}

function matcherFor(options, callback) {
    if (!callback && typeof options === 'function') {
        callback = options;
        options = null;
    }
    options = options || {};
    options.relative = false; //force absolute paths
    options.realpath = true; //force real paths (to match Node.js module paths)

    filesFor(options, (err, files) => {
        var fileMap = Object.create(null);
        var matchFn;
        /* istanbul ignore if - untestable */
        if (err) {
            return callback(err);
        }
        files.forEach(file => {
            fileMap[file] = true;
        });

        matchFn = function(file) {
            return fileMap[file];
        };
        matchFn.files = Object.keys(fileMap);
        return callback(null, matchFn);
    });
}

module.exports = {
    filesFor,
    matcherFor
};
