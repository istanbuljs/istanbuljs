/* globals describe, it, beforeEach, afterEach */
var hook = require('../lib/hook'),
    assert = require('chai').assert,
    currentHook,
    matcher = function (file) {
        return file.indexOf('foo.js') > 0;
    },
    matcher2 = function (file) {
        return file.indexOf('bar.es6') > 0;
    },
    transformer = function () {
        return 'module.exports.bar = function () { return "bar"; };';
    },
    transformer2 = function () {
        return 'module.exports.blah = function () { return "blah"; };';
    },
    badTransformer = function () {
        throw "Boo!";
    },
    scriptTransformer = function () {
        return '(function () { return 42; }());';
    },
    disabler,
    hookIt = function (m, t, o) {
        if (disabler) {
            disabler();
        }
        disabler = hook.hookRequire(m, t, o);
    };

describe('hooks', function () {
    describe('require', function () {
        beforeEach(function () {
            hookIt(matcher, transformer, {verbose: true});
        });

        afterEach(function () {
            hook.unloadRequireCache(matcher);
        });

        it('transforms foo', function () {
            var foo = require('./data/foo');
            assert.ok(foo.bar);
            assert.equal(foo.bar(), 'bar');
        });

        it('skips baz', function () {
            var foo = require('./data/baz');
            assert.ok(foo.baz);
            assert.equal(foo.baz(), 'baz');
        });

        it('should require original code when unhooked', function () {
            hookIt(matcher, transformer, {verbose: true});
            disabler();
            var foo = require('./data/foo');
            assert.ok(foo.foo);
            assert.equal(foo.foo(), 'foo');
        });

        it('calls post load hooks', function () {
            var called = null,
                opts = {
                    postLoadHook: function (file) {
                        called = file;
                    }
                };

            hookIt(matcher, transformer, opts);
            require('./data/foo');
            assert.ok(called.match(/foo\.js/));
        });

        it('unloads and reloads cache', function () {
            hookIt(matcher, transformer2);
            var foo = require('./data/foo');
            assert.ok(foo.blah);
            assert.equal(foo.blah(), 'blah');
        });

        it('returns original code on bad transform', function () {
            hookIt(matcher, badTransformer);
            var foo = require('./data/foo');
            assert.ok(foo.foo);
            assert.equal(foo.foo(), 'foo');
        });
    });
    describe('passing extensions to require', function () {
        beforeEach(function () {
            require.extensions['.es6'] = require.extensions['.js'];
            hookIt(matcher2, transformer2, {
                verbose: true,
                extensions: ['.es6']
            });
        });
        afterEach(function () {
            hook.unloadRequireCache(matcher2);
            delete require.extensions['.es6'];
        });
        it('transforms bar', function () {
            var bar = require('./data/bar');
            assert.ok(bar.blah);
            assert.equal(bar.blah(), 'blah');
        });
        it('skips foo', function () {
            var foo = require('./data/foo');
            assert.ok(foo.foo);
            assert.equal(foo.foo(), 'foo');
        });
        it('returns original code on bad transform', function () {
            hookIt(matcher2, badTransformer, {
                verbose: true,
                extensions: ['.es6']
            });
            var bar = require('./data/bar');
            assert.ok(bar.bar);
            assert.equal(bar.bar(), 'bar');
        });
    });
    describe('createScript', function () {
        beforeEach(function () {
            currentHook = require('vm').createScript;
        });
        afterEach(function () {
            require('vm').createScript = currentHook;
        });
        it('transforms foo (without any options)', function () {
            var s;
            hook.hookCreateScript(matcher, scriptTransformer);
            s = require('vm').createScript('(function () { return 10; }());', '/bar/foo.js');
            assert.equal(s.runInThisContext(), 42);
            hook.unhookCreateScript();
            s = require('vm').createScript('(function () { return 10; }());', '/bar/foo.js');
            assert.equal(s.runInThisContext(), 10);
        });
    });
    describe('runInThisContext', function () {
        beforeEach(function () {
            currentHook = require('vm').runInThisContext;
        });
        afterEach(function () {
            require('vm').runInThisContext = currentHook;
        });
        it('transforms foo', function () {
            var s;
            hook.hookRunInThisContext(matcher, scriptTransformer);
            s = require('vm').runInThisContext('(function () { return 10; }());', '/bar/foo.js');
            assert.equal(s, 42);
            hook.unhookRunInThisContext();
            s = require('vm').runInThisContext('(function () { return 10; }());', '/bar/foo.js');
            assert.equal(s, 10);
        });
        it('does not transform code with no filename', function () {
            var s;
            hook.hookRunInThisContext(matcher, scriptTransformer);
            s = require('vm').runInThisContext('(function () { return 10; }());');
            assert.equal(s, 10);
            hook.unhookCreateScript();
        });
        it('does not transform code with non-string filename', function () {
            var s;
            hook.hookRunInThisContext(matcher, scriptTransformer);
            s = require('vm').runInThisContext('(function () { return 10; }());', {});
            assert.equal(s, 10);
            hook.unhookCreateScript();
        });
    });
});