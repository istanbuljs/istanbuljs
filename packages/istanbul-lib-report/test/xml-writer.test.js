/* globals describe, it */

var assert = require('chai').assert,
    XMLWriter = require('../lib/xml-writer');

function MockContentWriter() {
    this.str = "";
}

MockContentWriter.prototype.write = function (s) {
    this.str += s;
};

MockContentWriter.prototype.println = function (s) {
    this.write(s + "\n");
};

describe('xml writer', function() {
    it('creates an XML document correctly', function () {
        var cw = new MockContentWriter(),
            xw = new XMLWriter(cw);
        xw.openTag("foo");
        xw.inlineTag("bar", { baz: "y"}, 'some text');
        xw.inlineTag("qux", {});
        xw.closeTag("foo");
        assert.equal(cw.str,'<foo>\n  <bar baz="y">some text</bar>\n  <qux/>\n</foo>\n');
    });

    it('auto-closes open tags correctly', function () {
        var cw = new MockContentWriter(),
            xw = new XMLWriter(cw);
        xw.openTag("foo");
        xw.inlineTag("bar", { baz: "y"}, 'some text');
        xw.inlineTag("qux");
        xw.closeAll();
        assert.equal(cw.str,'<foo>\n  <bar baz="y">some text</bar>\n  <qux/>\n</foo>\n');
    });

    it('throws when closing a tag when none open', function () {
        var cw = new MockContentWriter(),
            xw = new XMLWriter(cw);
        assert.throws(function () {
            xw.closeTag("foo");
        });
    });

    it('throws when closing a mismatched tag', function () {
        var cw = new MockContentWriter(),
            xw = new XMLWriter(cw);
        xw.openTag("bar");
        assert.throws(function () {
            xw.closeTag("foo");
        });
    });
});