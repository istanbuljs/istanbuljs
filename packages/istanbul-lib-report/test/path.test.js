'use strict';
/* globals describe, it, beforeEach, afterEach */

const path = require('path');
const assert = require('chai').assert;
const Path = require('../lib/path');

function commonBattery(windows) {
    const p = windows ? path.win32.parse : path.posix.parse;
    const s = windows ? '\\' : '/';
    return function() {
        beforeEach(() => {
            Path.tester.setParserAndSep(p, s);
        });
        afterEach(() => {
            Path.tester.reset();
        });
        [
            { s: '/', out: '' },
            { s: '/foo', out: 'foo' },
            { s: '/foo/bar/baz.txt', out: 'foo/bar/baz.txt' }
        ].forEach(t => {
            it('returns "' + t.out + '" on "' + t.s + '"', () => {
                const p = new Path(t.s);
                assert.equal(p.toString(), t.out);
            });
        });
    };
}

describe('path', () => {
    describe('common paths on posix', commonBattery(false));
    describe('common paths on windows', commonBattery(true));

    describe('posix specific paths', () => {
        beforeEach(() => {
            Path.tester.setParserAndSep(path.posix.parse, '/');
        });
        afterEach(() => {
            Path.tester.reset();
        });
        [{ s: '//foo/bar/baz.txt', out: 'foo/bar/baz.txt' }].forEach(t => {
            it('returns "' + t.out + '" on "' + t.s + '"', () => {
                const p = new Path(t.s);
                assert.equal(p.toString(), t.out);
            });
        });
    });

    describe('windows specific paths', () => {
        beforeEach(() => {
            Path.tester.setParserAndSep(path.win32.parse, '\\');
        });
        afterEach(() => {
            Path.tester.reset();
        });
        [
            { s: 'c:\\', out: '' },
            { s: 'c:\\foo', out: 'foo' },
            { s: 'c:\\foo\\bar\\baz.txt', out: 'foo/bar/baz.txt' },
            { s: 'f:\\\\foo\\\\bar\\\\baz.txt', out: 'foo/bar/baz.txt' },
            { s: '//c:\\foo\\bar', out: 'foo/bar' }
        ].forEach(t => {
            it('returns "' + t.out + '" on "' + t.s + '"', () => {
                const p = new Path(t.s);
                assert.equal(p.toString(), t.out);
            });
        });
    });

    describe('path operations [posix only]', () => {
        beforeEach(() => {
            Path.tester.setParserAndSep(path.posix.parse, '/');
        });
        afterEach(() => {
            Path.tester.reset();
        });

        it('returns elements and supports a length property correctly', () => {
            const p = new Path('/foo/bar');
            assert.deepEqual(p.elements(), ['foo', 'bar']);
            assert.equal(p.length, 2);
        });

        it('can be inited with an array', () => {
            const p = new Path(['foo', 'bar']);
            assert.deepEqual(p.elements(), ['foo', 'bar']);
        });

        it('returns a parent when possible', () => {
            const p = new Path('/foo/bar').parent();
            assert.equal(p.toString(), 'foo');

            const gp = p.parent();
            assert.equal(gp.toString(), '');
        });

        it('throws when a parent cannot be returned', () => {
            const p = new Path('');
            assert.deepEqual(p.elements(), []);
            assert.ok(!p.hasParent());
            assert.throws(() => p.parent());
        });

        it('answers for containment correctly', () => {
            assert.ok(
                new Path('/foo/bar/baz/quux').contains(new Path('foo/bar'))
            );
            assert.ok(
                !new Path('/foo/bar').contains(new Path('/foo/bar/baz/quux'))
            );
            assert.ok(
                !new Path('/foo/bar/baz').contains(new Path('/foo/bling/baz'))
            );
            assert.ok(new Path('/foo/bar').contains(new Path('/foo/bar')));

            assert.ok(new Path('/foo').ancestorOf(new Path('/foo/bar')));
            assert.ok(!new Path('/foo/bar').ancestorOf(new Path('/foo/bar')));

            assert.ok(new Path('/foo/bar').descendantOf(new Path('/foo')));
            assert.ok(!new Path('/foo/bar').descendantOf(new Path('/foo/bar')));
        });

        it('does not allow construction with random input', () => {
            assert.throws(() => new Path({}));
        });

        it('propagates array operations correctly', () => {
            const p = new Path('/foo/bar');
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

        it('calculates a common prefix path when one exists', () => {
            const p = new Path('/foo/bar/baz').commonPrefixPath(
                new Path('/foo/bar')
            );
            assert.deepEqual(['foo', 'bar'], p.elements());
        });

        it('calculates a common prefix path when one exists at a higher level', () => {
            const p = new Path('/foo/bar/baz').commonPrefixPath(
                new Path('/foo/baz/quux')
            );
            assert.deepEqual(['foo'], p.elements());
        });

        it('calculates an empty prefix path when no overlap', () => {
            const p = new Path('/foo1/bar/baz').commonPrefixPath(
                new Path('/foo2/baz/quux')
            );
            assert.deepEqual([], p.elements());
        });

        it('compares paths correctly', () => {
            assert.equal(Path.compare(new Path('foo'), new Path('foo')), 0);
            assert.equal(Path.compare(new Path('foo'), new Path('boo')), 1);
            assert.equal(Path.compare(new Path('boo'), new Path('foo')), -1);
            assert.equal(Path.compare(new Path('z'), new Path('a/b')), -1);
            assert.equal(Path.compare(new Path('a/b/c'), new Path('z/z')), 1);
        });
    });
});
