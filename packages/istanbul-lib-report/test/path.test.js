/* globals describe, it, beforeEach, afterEach */

var assert = require('chai').assert,
    parser = require('path-parse'),
    Path = require('../lib/path');

function commonBattery(windows) {
    var p = windows ? parser.win32 : parser.posix,
        s = windows ? '\\' : '/';
    return function () {
        beforeEach(function () {
            Path.tester.setParserAndSep(p, s);
        });
        afterEach(function () {
            Path.tester.reset();
        });
        [
            {s: '/', out: ''},
            {s: '/foo', out: 'foo'},
            {s: '/foo/bar/baz.txt', out: 'foo/bar/baz.txt'}
        ].forEach(function (t) {
                it('returns "' + t.out + '" on "' + t.s + '"', function () {
                    var p = new Path(t.s);
                    assert.equal(p.toString(), t.out);
                });
            });
    };
}

describe('path', function() {
    describe('common paths on posix', commonBattery(false));
    describe('common paths on windows', commonBattery(true));

    describe('posix specific paths', function () {
        beforeEach(function () {
            Path.tester.setParserAndSep(parser.posix, '/');
        });
        afterEach(function () {
            Path.tester.reset();
        });
        [
            {s: '//foo/bar/baz.txt', out: 'foo/bar/baz.txt'}
        ].forEach(function (t) {
                it('returns "' + t.out + '" on "' + t.s + '"', function () {
                    var p = new Path(t.s);
                    assert.equal(p.toString(), t.out);
                });
            });

    });

    describe('windows specific paths', function () {
        beforeEach(function () {
            Path.tester.setParserAndSep(parser.win32, '\\');
        });
        afterEach(function () {
            Path.tester.reset();
        });
        [
            {s: 'c:\\', out: ''},
            {s: 'c:\\foo', out: 'foo'},
            {s: 'c:\\foo\\bar\\baz.txt', out: 'foo/bar/baz.txt'},
            {s: 'f:\\\\foo\\\\bar\\\\baz.txt', out: 'foo/bar/baz.txt'},
            {s: '//c:\\foo\\bar', out: 'foo/bar'}
        ].forEach(function (t) {
                it('returns "' + t.out + '" on "' + t.s + '"', function () {
                    var p = new Path(t.s);
                    assert.equal(p.toString(), t.out);
                });
            });
    });

    describe('path operations [posix only]', function () {
        beforeEach(function () {
            Path.tester.setParserAndSep(parser.posix, '/');
        });
        afterEach(function () {
            Path.tester.reset();
        });

        it('returns elements and supports a length property correctly', function () {
            var p = new Path('/foo/bar');
            assert.deepEqual(p.elements(), ['foo', 'bar']);
            assert.equal(p.length, 2);
        });

        it('can be inited with an array', function () {
            var p = new Path(['foo', 'bar']);
            assert.deepEqual(p.elements(), ['foo', 'bar']);
        });

        it('returns a parent when possible', function () {
            var p = new Path('/foo/bar').parent(),
                gp;
            assert.equal(p.toString(), 'foo');
            gp = p.parent();
            assert.equal(gp.toString(), '');
        });

        it('throws when a parent cannot be returned', function () {
            var p = new Path('');
            assert.deepEqual(p.elements(), []);
            assert.ok(!p.hasParent());
            assert.throws(function () {
                return p.parent();
            });
        });

        it('answers for containment correctly', function () {
            assert.ok(new Path('/foo/bar/baz/quux').contains(new Path('foo/bar')));
            assert.ok(!(new Path('/foo/bar').contains(new Path('/foo/bar/baz/quux'))));
            assert.ok(!(new Path('/foo/bar/baz').contains(new Path('/foo/bling/baz'))));
            assert.ok(new Path('/foo/bar').contains(new Path('/foo/bar')));

            assert.ok(new Path('/foo').ancestorOf(new Path('/foo/bar')));
            assert.ok(!(new Path('/foo/bar').ancestorOf(new Path('/foo/bar'))));

            assert.ok(new Path('/foo/bar').descendantOf(new Path('/foo')));
            assert.ok(!(new Path('/foo/bar').descendantOf(new Path('/foo/bar'))));
        });

        it('does not allow construction with random input', function () {
            assert.throws(function () {
                return new Path({});
            });
        });

        it('propagates array operations correctly', function () {
            var p = new Path('/foo/bar');
            assert.deepEqual(p.toString(), 'foo/bar');
            p.unshift('root');
            assert.deepEqual(p.toString(), 'root/foo/bar');
            p.shift();
            assert.deepEqual(p.toString(), 'foo/bar');
            p.push('blee');
            assert.deepEqual(p.toString(), 'foo/bar/blee');
            p.pop();
            assert.deepEqual(p.toString(), 'foo/bar');
        });

        it('calculates a common prefix path when one exists', function () {
            var p = new Path('/foo/bar/baz').commonPrefixPath(new Path('/foo/bar'));
            assert.deepEqual(['foo', 'bar'], p.elements());
        });

        it('calculates a common prefix path when one exists at a higher level', function () {
            var p = new Path('/foo/bar/baz').commonPrefixPath(new Path('/foo/baz/quux'));
            assert.deepEqual(['foo'], p.elements());
        });

        it('calculates an empty prefix path when no overlap', function () {
            var p = new Path('/foo1/bar/baz').commonPrefixPath(new Path('/foo2/baz/quux'));
            assert.deepEqual([], p.elements());
        });

        it('compares paths correctly', function () {
            assert.equal(Path.compare(new Path('foo'), new Path('foo')), 0);
            assert.equal(Path.compare(new Path('foo'), new Path('boo')), 1);
            assert.equal(Path.compare(new Path('boo'), new Path('foo')), -1);
            assert.equal(Path.compare(new Path('z'), new Path('a/b')), -1);
            assert.equal(Path.compare(new Path('a/b/c'), new Path('z/z')), 1);
        });
    });
});
