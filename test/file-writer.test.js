/* globals describe, it, beforeEach, afterEach */

var assert = require('chai').assert,
    FileWriter = require('../lib/file-writer'),
    path = require('path'),
    dataDir = path.resolve(__dirname, '.data'),
    mkdirp = require('mkdirp'),
    rimraf = require('rimraf'),
    fs = require('fs');

describe('file-writer', function() {
    var writer;

    beforeEach(function () {
        mkdirp.sync(dataDir);
        writer = new FileWriter(dataDir);
    });

    afterEach(function () {
        rimraf.sync(dataDir);
    });

    it('returns a content writer for file', function () {
        var cw = writer.writeFile('foo/bar.txt');
        cw.println("hello");
        assert.equal('foo', cw.colorize('foo', 'unknown'));
        cw.close();
        assert.equal(fs.readFileSync(path.resolve(dataDir, 'foo/bar.txt'), 'utf8'), 'hello\n');
    });

    it('returns a console writer for terminal', function () {
        var cw = writer.writeFile('-');
        cw.println("hello");
        assert.equal('foo', cw.colorize('foo'));
        cw.close();
    });

    it('copies files', function () {
        writer.copyFile(__filename,'out.txt');
        assert.equal(fs.readFileSync(path.resolve(dataDir, 'out.txt'), 'utf8'),
            fs.readFileSync(__filename, 'utf8'));
    });

    it('provides writers for subdirs', function () {
        var w = writer.writerForDir("foo"),
            cw = w.writeFile('bar.txt');
        cw.println("hello");
        cw.close();
        assert.equal(fs.readFileSync(path.resolve(dataDir, 'foo/bar.txt'), 'utf8'), 'hello\n');
    });

    it('requires an initial path', function () {
        assert.throws(function () {
            return new FileWriter();
        });
    });

    it('barfs on absolute paths', function () {
        assert.throws(function () {
            writer.writeFile(__filename);
        });
        assert.throws(function () {
            writer.copyFile(__filename, __filename);
        });
        assert.throws(function () {
            writer.writerForDir(__dirname);
        });
    });
});
