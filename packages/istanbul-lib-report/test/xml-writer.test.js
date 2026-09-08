'use strict';
/* globals describe, it */

const assert = require('chai').assert;
const XMLWriter = require('../lib/xml-writer');

function MockContentWriter() {
    this.str = '';
}

MockContentWriter.prototype.write = function(s) {
    this.str += s;
};

MockContentWriter.prototype.println = function(s) {
    this.write(s + '\n');
};

describe('xml writer', () => {
    it('creates an XML document correctly', () => {
        const cw = new MockContentWriter();
        const xw = new XMLWriter(cw);
        xw.openTag('foo');
        xw.inlineTag('bar', { baz: 'y' }, 'some text');
        xw.inlineTag('qux', {});
        xw.closeTag('foo');
        assert.equal(
            cw.str,
            '<foo>\n  <bar baz="y">some text</bar>\n  <qux/>\n</foo>\n'
        );
    });

    it('auto-closes open tags correctly', () => {
        const cw = new MockContentWriter();
        const xw = new XMLWriter(cw);
        xw.openTag('foo');
        xw.inlineTag('bar', { baz: 'y' }, 'some text');
        xw.inlineTag('qux');
        xw.closeAll();
        assert.equal(
            cw.str,
            '<foo>\n  <bar baz="y">some text</bar>\n  <qux/>\n</foo>\n'
        );
    });

    it('throws when closing a tag when none open', () => {
        const cw = new MockContentWriter();
        const xw = new XMLWriter(cw);
        assert.throws(() => {
            xw.closeTag('foo');
        });
    });

    it('throws when closing a mismatched tag', () => {
        const cw = new MockContentWriter();
        const xw = new XMLWriter(cw);
        xw.openTag('bar');
        assert.throws(() => {
            xw.closeTag('foo');
        });
    });

    it('escapes XML-significant characters in attributes and content', () => {
        const cw = new MockContentWriter();
        const xw = new XMLWriter(cw);
        xw.openTag('file', {
            name: 'Barnes&Noble.js',
            path: 'src/<foo>"bar"'
        });
        xw.inlineTag('source', null, '/tmp/a&b');
        xw.closeTag('file');
        assert.equal(
            cw.str,
            '<file name="Barnes&amp;Noble.js" path="src/&lt;foo&gt;&quot;bar&quot;">\n  <source>/tmp/a&amp;b</source>\n</file>\n'
        );
    });
});
