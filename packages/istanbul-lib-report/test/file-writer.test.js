'use strict';
/* globals describe, it, beforeEach, afterEach */

const fs = require('fs');
const path = require('path');
const assert = require('chai').assert;
const mkdirp = require('make-dir');
const rimraf = require('rimraf');
const FileWriter = require('../lib/file-writer');

const dataDir = path.resolve(__dirname, '.data');

describe('file-writer', () => {
    let writer;

    beforeEach(() => {
        mkdirp.sync(dataDir);
        writer = new FileWriter(dataDir);
    });

    afterEach(() => {
        rimraf.sync(dataDir);
    });

    it('returns a content writer for file', () => {
        const cw = writer.writeFile('foo/bar.txt');
        cw.println('hello');
        assert.equal('foo', cw.colorize('foo', 'unknown'));
        cw.close();
        assert.equal(
            fs.readFileSync(path.resolve(dataDir, 'foo/bar.txt'), 'utf8'),
            'hello\n'
        );
    });

    it('returns a console writer for terminal', () => {
        const cw = writer.writeFile('-');
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

    it('copies binary files', () => {
        const testBuffer = Buffer.from([195, 40]);
        fs.writeFileSync(path.resolve(dataDir, 'in.bin'), testBuffer);
        writer.copyFile(path.resolve(dataDir, 'in.bin'), 'out.bin');
        assert.equal(
            Buffer.compare(
                fs.readFileSync(path.resolve(dataDir, 'out.bin')),
                testBuffer
            ),
            0
        );
    });

    it('copies files while adding headers', () => {
        const header =
            '/* This is some header text, like a copyright or directive. */\n';
        writer.copyFile(__filename, 'out.txt', header);
        assert.equal(
            fs.readFileSync(path.resolve(dataDir, 'out.txt'), 'utf8'),
            header + fs.readFileSync(__filename, 'utf8')
        );
    });

    it('provides writers for subdirs', () => {
        const w = writer.writerForDir('foo');
        const cw = w.writeFile('bar.txt');
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
