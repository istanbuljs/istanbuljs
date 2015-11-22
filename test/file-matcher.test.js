/* globals describe, it, beforeEach */

var assert = require('chai').assert,
    path = require('path'),
    fileset = require('fileset'),
    root = path.resolve(__dirname, 'data', 'matcher'),
    src = '../lib/file-matcher.js',
    fileMatcher = require(src),
    allFiles;

describe('file matcher', function () {
    beforeEach(function (cb) {
        if (!allFiles) {
            fileset('**/*.js', '', {cwd: root}, function (err, files) {
                allFiles = files.map(function (file) {
                    return path.resolve(root, file);
                });
                cb();
            });
        } else {
            cb();
        }
    });
    it('returns all files except those under node_modules by default', function (cb) {
        fileMatcher.filesFor(function (err, files) {
            assert.ok(!err);
            allFiles.forEach(function (file) {
                var matcher = function (f) {
                        return f === file;
                    },
                    shouldMatch = file.indexOf('file.js') < 0;
                if (shouldMatch) {
                    assert.ok(files.filter(matcher).length, 'Should match [' + file + '] but did not');
                } else {
                    assert.ok(!files.filter(matcher).length, 'Should NOT match [' + file + '] but did');
                }
            });
            cb();
        });
    });
    it('returns relative filenames when requested', function (cb) {
        fileMatcher.filesFor({
            root: root,
            relative: true
        }, function (err, files) {
            assert.ok(!err);
            allFiles.forEach(function (file) {
                var matcher = function (f) {
                        return path.resolve(root, f) === file;
                    },
                    shouldMatch = file.indexOf('file.js') < 0;
                if (shouldMatch) {
                    assert.ok(files.filter(matcher).length, 'Should match [' + file + '] but did not');
                } else {
                    assert.ok(!files.filter(matcher).length, 'Should NOT match [' + file + '] but did');
                }
            });
            cb();
        });
    });
    it('matches stuff under cwd', function (cb) {
        fileMatcher.matcherFor(function (err, matchFn) {
            assert.ok(!err);
            assert.ok(matchFn(path.resolve(__dirname, src)), 'should match itself');
            cb();
        });
    });
    it('matches stuff under cwd overriding relative opts passed in', function (cb) {
        fileMatcher.matcherFor({relative: true}, function (err, matchFn) {
            assert.ok(!err);
            assert.ok(matchFn(path.resolve(__dirname, src)), 'should match itself');
            cb();
        });
    });
    it('ignores node_modules', function (cb) {
        fileMatcher.matcherFor({root: root}, function (err, matchFn) {
            assert.ok(!err);
            assert.ok(matchFn.files);
            assert.deepEqual(matchFn.files.sort(), allFiles.filter(function (f) {
                return !f.match(/node_modules/);
            }).sort());
            allFiles.forEach(function (file) {
                var shouldMatch = file.indexOf('file.js') < 0;
                if (shouldMatch) {
                    assert.ok(matchFn(file), 'Should match [' + file + '] but did not');
                } else {
                    assert.ok(!matchFn(file), 'Should NOT match [' + file + '] but did');
                }
            });
            cb();
        });
    });
    it('matches stuff with explicit includes and excludes', function (cb) {
        fileMatcher.matcherFor({
            root: root,
            includes: ['**/general/**/*.js'],
            excludes: ['**/general.js']
        }, function (err, matchFn) {
            assert.ok(!err);
            allFiles.forEach(function (file) {
                if (file.indexOf('/general/') < 0) {
                    return;
                }
                var shouldMatch = file.indexOf('file.js') >= 0;
                if (shouldMatch) {
                    assert.ok(matchFn(file), 'Should match [' + file + '] but did not');
                } else {
                    assert.ok(!matchFn(file), 'Should NOT match [' + file + '] but did');
                }
            });
            cb();
        });
    });
});
