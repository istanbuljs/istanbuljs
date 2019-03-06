/* globals describe, it, beforeEach, afterEach */

var assert = require('chai').assert;
var FileWriter = require('../lib/file-writer');
var path = require('path');
var dataDir = path.resolve(__dirname, '.data');
var mkdirp = require('make-dir');
var rimraf = require('rimraf');
var fs = require('fs');

describe('file-writer', () => {
    var writer;

    beforeEach(() => {
        mkdirp.sync(dataDir);
        writer = new FileWriter(dataDir);
    });

    afterEach(() => {
        rimraf.sync(dataDir);
    });

    it('returns a content writer for file', () => {
        var cw = writer.writeFile('foo/bar.txt');
        cw.println('hello');
        assert.equal('foo', cw.colorize('foo', 'unknown'));
        cw.close();
        assert.equal(
            fs.readFileSync(path.resolve(dataDir, 'foo/bar.txt'), 'utf8'),
            'hello\n'
        );
    });

    it('returns a console writer for terminal', () => {
        var cw = writer.writeFile('-');
        cw.println('hello');
        assert.equal('foo', cw.colorize('foo'));
        cw.close();
    });

    it('copies files', () => {
        writer.copyFile(__filename, 'out.txt');
        assert.equal(
            fs.readFileSync(path.resolve(dataDir, 'out.txt'), 'utf8'),
            fs.readFileSync(__filename, 'utf8')
        );
    });

    it('copies files while adding headers', () => {
        var header =
            '/* This is some header text, like a copyright or directive. */\n';
        writer.copyFile(__filename, 'out.txt', header);
        assert.equal(
            fs.readFileSync(path.resolve(dataDir, 'out.txt'), 'utf8'),
            header + fs.readFileSync(__filename, 'utf8')
        );
    });

    it('provides writers for subdirs', () => {
        var w = writer.writerForDir('foo');
        var cw = w.writeFile('bar.txt');
        cw.println('hello');
        cw.close();
        assert.equal(
            fs.readFileSync(path.resolve(dataDir, 'foo/bar.txt'), 'utf8'),
            'hello\n'
        );
    });

    it('requires an initial path', () => {
        assert.throws(() => new FileWriter());
    });

    it('barfs on absolute paths', () => {
        assert.throws(() => {
            writer.writeFile(__filename);
        });
        assert.throws(() => {
            writer.copyFile(__filename, __filename);
        });
        assert.throws(() => {
            writer.writerForDir(__dirname);
        });
    });
});
