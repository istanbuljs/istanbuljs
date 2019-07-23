'use strict';
/* globals describe, it, beforeEach, afterEach */
const assert = require('chai').assert;
const hook = require('../lib/hook');

let currentHook;
const matcher = function(file) {
    return file.indexOf('foo.js') > 0;
};
const matcher2 = function(file) {
    return file.indexOf('bar.es6') > 0;
};
const transformer = function() {
    return 'module.exports.bar = function () { return "bar"; };';
};
const transformer2 = function() {
    return 'module.exports.blah = function () { return "blah"; };';
};
const badTransformer = function() {
    throw 'Boo!';
};
const scriptTransformer = function() {
    return '(function () { return 42; }());';
};
let disabler;
const hookIt = function(m, t, o) {
    if (disabler) {
        disabler();
    }
    disabler = hook.hookRequire(m, t, o);
};

describe('hooks', () => {
    describe('require', () => {
        beforeEach(() => {
            hookIt(matcher, transformer, { verbose: true });
        });

        afterEach(() => {
            hook.unloadRequireCache(matcher);
        });

        it('transforms foo', () => {
            const foo = require('./data/foo');
            assert.ok(foo.bar);
            assert.equal(foo.bar(), 'bar');
        });

        it('skips baz', () => {
            const foo = require('./data/baz');
            assert.ok(foo.baz);
            assert.equal(foo.baz(), 'baz');
        });

        it('should require original code when unhooked', () => {
            hookIt(matcher, transformer, { verbose: true });
            disabler();
            const foo = require('./data/foo');
            assert.ok(foo.foo);
            assert.equal(foo.foo(), 'foo');
        });

        it('calls post load hooks', () => {
            let called = null;
            const opts = {
                postLoadHook(file) {
                    called = file;
                }
            };

            hookIt(matcher, transformer, opts);
            require('./data/foo');
            assert.ok(called.match(/foo\.js/));
        });

        it('unloads and reloads cache', () => {
            hookIt(matcher, transformer2);
            const foo = require('./data/foo');
            assert.ok(foo.blah);
            assert.equal(foo.blah(), 'blah');
        });

        it('returns original code on bad transform', () => {
            hookIt(matcher, badTransformer);
            const foo = require('./data/foo');
            assert.ok(foo.foo);
            assert.equal(foo.foo(), 'foo');
        });
    });
    describe('passing extensions to require', () => {
        beforeEach(() => {
            require.extensions['.es6'] = require.extensions['.js'];
            hookIt(matcher2, transformer2, {
                verbose: true,
                extensions: ['.es6']
            });
        });
        afterEach(() => {
            hook.unloadRequireCache(matcher2);
            delete require.extensions['.es6'];
        });
        it('transforms bar', () => {
            const bar = require('./data/bar');
            assert.ok(bar.blah);
            assert.equal(bar.blah(), 'blah');
        });
        it('skips foo', () => {
            const foo = require('./data/foo');
            assert.ok(foo.foo);
            assert.equal(foo.foo(), 'foo');
        });
        it('returns original code on bad transform', () => {
            hookIt(matcher2, badTransformer, {
                verbose: true,
                extensions: ['.es6']
            });
            const bar = require('./data/bar');
            assert.ok(bar.bar);
            assert.equal(bar.bar(), 'bar');
        });
    });
    describe('createScript', () => {
        beforeEach(() => {
            currentHook = require('vm').createScript;
        });
        afterEach(() => {
            require('vm').createScript = currentHook;
        });
        it('transforms foo (without any options)', () => {
            let s;
            hook.hookCreateScript(matcher, scriptTransformer);
            s = require('vm').createScript(
                '(function () { return 10; }());',
                '/bar/foo.js'
            );
            assert.equal(s.runInThisContext(), 42);
            hook.unhookCreateScript();
            s = require('vm').createScript(
                '(function () { return 10; }());',
                '/bar/foo.js'
            );
            assert.equal(s.runInThisContext(), 10);
        });
    });
    describe('runInThisContext', () => {
        beforeEach(() => {
            currentHook = require('vm').runInThisContext;
        });
        afterEach(() => {
            require('vm').runInThisContext = currentHook;
        });
        it('transforms foo', () => {
            let s;
            hook.hookRunInThisContext(matcher, scriptTransformer);
            s = require('vm').runInThisContext(
                '(function () { return 10; }());',
                { filename: '/bar/foo.js' }
            );
            assert.equal(s, 42);
            hook.unhookRunInThisContext();
            s = require('vm').runInThisContext(
                '(function () { return 10; }());',
                { filename: '/bar/foo.js' }
            );
            assert.equal(s, 10);
        });
        it('does not transform code with no filename', () => {
            hook.hookRunInThisContext(matcher, scriptTransformer);
            const s = require('vm').runInThisContext(
                '(function () { return 10; }());'
            );
            assert.equal(s, 10);
            hook.unhookRunInThisContext();
        });
        it('does not transform code with non-string filename', () => {
            hook.hookRunInThisContext(matcher, scriptTransformer);
            const s = require('vm').runInThisContext(
                '(function () { return 10; }());',
                {}
            );
            assert.equal(s, 10);
            hook.unhookRunInThisContext();
        });
    });
    describe('runInContext', () => {
        beforeEach(() => {
            currentHook = require('vm').runInContext;
        });
        afterEach(() => {
            require('vm').runInContext = currentHook;
        });
        it('transforms foo', () => {
            let s;
            const vm = require('vm');
            hook.hookRunInContext(matcher, scriptTransformer);
            s = vm.runInContext(
                '(function () { return 10; }());',
                vm.createContext({}),
                '/bar/foo.js'
            );
            assert.equal(s, 42);
            hook.unhookRunInContext();
            s = vm.runInContext(
                '(function () { return 10; }());',
                vm.createContext({}),
                '/bar/foo.js'
            );
            assert.equal(s, 10);
        });
        it('transfers coverageVar when not set globally', () => {
            let s;
            const vm = require('vm');
            const scriptTransformer = function() {
                return `(function () {
                    fakeCoverageVar.success = true;
                    return 42;
                }());`;
            };
            /* this simulates all unit tests being run through vm.runInContext */
            hook.hookRunInContext(matcher, scriptTransformer, {
                coverageVariable: 'fakeCoverageVar'
            });
            s = vm.runInContext(
                '(function () { return 10; }());',
                vm.createContext({}),
                '/bar/foo.js'
            );
            assert.equal(s, 42);
            assert.deepEqual(global.fakeCoverageVar, { success: true });
            hook.unhookRunInContext();
            s = vm.runInContext(
                '(function () { return 10; }());',
                vm.createContext({}),
                '/bar/foo.js'
            );
            assert.equal(s, 10);
        });
        it('does not transform code with no filename', () => {
            const vm = require('vm');
            hook.hookRunInContext(matcher, scriptTransformer);
            const s = vm.runInContext(
                '(function () { return 10; }());',
                vm.createContext({})
            );
            assert.equal(s, 10);
            hook.unhookRunInContext();
        });
        it('does not transform code with non-string filename', () => {
            const vm = require('vm');
            hook.hookRunInContext(matcher, scriptTransformer);
            const s = vm.runInContext(
                '(function () { return 10; }());',
                vm.createContext({}),
                {}
            );
            assert.equal(s, 10);
            hook.unhookRunInContext();
        });
    });
});
