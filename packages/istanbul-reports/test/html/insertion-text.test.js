/* globals describe, it, beforeEach */
var assert = require('chai').assert,
    InsertionText = require('../../lib/html/insertion-text');

describe('insertion text', function () {
    var text;
    describe('regular version', function () {
        beforeEach(function () {
            text = new InsertionText("hello world");
        });
        it("spans hello", function () {
            text.insertAt(0, '<span class="h">');
            text.insertAt(5, '</span>');
            assert.equal(text.toString(), '<span class="h">hello</span> world');
        });
        it("spans world", function () {
            text.insertAt(6, '<span class="w">');
            text.insertAt(11, '</span>');
            assert.equal(text.toString(), 'hello <span class="w">world</span>');
        });
       it("nests spans around hello (improperly)", function () {
            text.insertAt(0, '<span class="h">');
            text.insertAt(5, '</span>');
            text.insertAt(0, '<div class="w">');
            text.insertAt(5, '</div>');
            assert.equal(text.toString(), '<span class="h"><div class="w">hello</span></div> world');
        });
        it("nests spans around hello (properly)", function () {
            text.insertAt(0, '<span class="w">', true);
            text.insertAt(5, '</span>');
            text.insertAt(0, '<div class="h">', true);
            text.insertAt(5, '</div>');
            assert.equal(text.toString(), '<div class="h"><span class="w">hello</span></div> world');
        });
        it("allows syntactic sugar for wrapping text", function () {
            text.wrap(0, '<span class="h">', 5, '</span>');
            text.wrap(0, '<div class="w">', 5, '</div>');
            assert.equal(text.toString(), '<div class="w"><span class="h">hello</span></div> world');
        });
        it("chain calls for wrapping text", function () {
            text.wrap(0, '<span class="h">', 5, '</span>').
                wrap(0, '<div class="w">', 5, '</div>');
            assert.equal(text.toString(), '<div class="w"><span class="h">hello</span></div> world');
        });
        it("inserts text between two insertions", function () {
            text.wrap(0, '<span class="h">', 5, '</span>').
                insertAt(3, "w");
            assert.equal(text.toString(), '<span class="h">helwlo</span> world');
        });
        it("prepends on negative insertion index", function () {
            text.insertAt(-3, "XXX");
            assert.equal(text.toString(), 'XXXhello world');
        });
        it("appends on out-of-bounds insertion index", function () {
            text.insertAt(100, "XXX");
            assert.equal(text.toString(), 'hello worldXXX');
        });
        it("wraps entire line correctly", function () {
            text.wrapLine('<span>', '</span>');
            assert.equal(text.toString(), '<span>hello world</span>');
        });
        it("consumes blanks in an individual call", function () {
            text = new InsertionText("  hello world  ");
            text.wrap(2, '<span>', 13, '</span>', true);
            assert.equal(text.toString(), '<span>  hello world  </span>');
        });
    });

    describe('blank consuming insertions', function () {
        beforeEach(function () {
            text = new InsertionText("    hello world    ", true);
        });
        it("consumes leading spaces when spanning first word", function () {
            text.wrap(4, '<span class="h">', 9, '</span>');
            assert.equal(text.toString(), '<span class="h">    hello</span> world    ');
        });
        it("consumes trailing spaces when spanning second word", function () {
            text.wrap(10, '<span class="h">', 15, '</span>');
            assert.equal(text.toString(), '    hello <span class="h">world    </span>');
        });
        it("is able to suppress blank consumption in an individual call", function () {
            text = new InsertionText("  hello world  ");
            text.wrap(2, '<span>', 13, '</span>', false);
            assert.equal(text.toString(), '  <span>hello world</span>  ');
        });
    });
});

