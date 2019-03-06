/* globals describe, it, before */

const path = require('path');
const assert = require('chai').assert;
const fileset = require('fileset');
const src = '../lib/file-matcher.js';

const root = path.resolve(__dirname, 'data', 'matcher');
const fileMatcher = require(src);
let allFiles;

describe('file matcher', () => {
    before(cb => {
        if (!allFiles) {
            fileset('**/*.js', '', { cwd: root }, (err, files) => {
                allFiles = files.map(file => path.resolve(root, file));
                cb();
            });
        } else {
            cb();
        }
    });
    it('returns all files except those under node_modules by default', cb => {
        fileMatcher.filesFor((err, files) => {
            assert.ok(!err);
            allFiles.forEach(file => {
                const matcher = function(f) {
                    return f === file;
                };
                const shouldMatch = file.indexOf('file.js') < 0;
                if (shouldMatch) {
                    assert.ok(
                        files.filter(matcher).length,
                        'Should match [' + file + '] but did not'
                    );
                } else {
                    assert.ok(
                        !files.filter(matcher).length,
                        'Should NOT match [' + file + '] but did'
                    );
                }
            });
            cb();
        });
    });
    it('returns relative filenames when requested', cb => {
        fileMatcher.filesFor(
            {
                root,
                relative: true
            },
            (err, files) => {
                assert.ok(!err);
                allFiles.forEach(file => {
                    const matcher = function(f) {
                        return path.resolve(root, f) === file;
                    };
                    const shouldMatch = file.indexOf('file.js') < 0;
                    if (shouldMatch) {
                        assert.ok(
                            files.filter(matcher).length,
                            'Should match [' + file + '] but did not'
                        );
                    } else {
                        assert.ok(
                            !files.filter(matcher).length,
                            'Should NOT match [' + file + '] but did'
                        );
                    }
                });
                cb();
            }
        );
    });
    it('matches stuff under cwd', cb => {
        fileMatcher.matcherFor((err, matchFn) => {
            assert.ok(!err);
            assert.ok(
                matchFn(path.resolve(__dirname, src)),
                'should match itself'
            );
            cb();
        });
    });
    it('matches stuff under cwd overriding relative opts passed in', cb => {
        fileMatcher.matcherFor({ relative: true }, (err, matchFn) => {
            assert.ok(!err);
            assert.ok(
                matchFn(path.resolve(__dirname, src)),
                'should match itself'
            );
            cb();
        });
    });
    it('ignores node_modules', cb => {
        fileMatcher.matcherFor({ root }, (err, matchFn) => {
            assert.ok(!err);
            assert.ok(matchFn.files);
            assert.deepEqual(
                matchFn.files.sort(),
                allFiles.filter(f => !f.match(/node_modules/)).sort()
            );
            allFiles.forEach(file => {
                const shouldMatch = file.indexOf('file.js') < 0;
                if (shouldMatch) {
                    assert.ok(
                        matchFn(file),
                        'Should match [' + file + '] but did not'
                    );
                } else {
                    assert.ok(
                        !matchFn(file),
                        'Should NOT match [' + file + '] but did'
                    );
                }
            });
            cb();
        });
    });
    it('matches stuff with explicit includes and excludes', cb => {
        fileMatcher.matcherFor(
            {
                root,
                includes: ['**/general/**/*.js'],
                excludes: ['**/general.js']
            },
            (err, matchFn) => {
                assert.ok(!err);
                allFiles.forEach(file => {
                    if (file.indexOf('/general/') < 0) {
                        return;
                    }
                    const shouldMatch = file.indexOf('file.js') >= 0;
                    if (shouldMatch) {
                        assert.ok(
                            matchFn(file),
                            'Should match [' + file + '] but did not'
                        );
                    } else {
                        assert.ok(
                            !matchFn(file),
                            'Should NOT match [' + file + '] but did'
                        );
                    }
                });
                cb();
            }
        );
    });
});
