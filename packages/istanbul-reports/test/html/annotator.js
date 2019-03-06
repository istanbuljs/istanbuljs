/* globals describe, it */
var fs = require('fs'),
    annotator = require('../../lib/html/annotator'),
    istanbulLibCoverage = require('istanbul-lib-coverage');

require('chai').should();

function getFixture(fixtureName) {
    var fileCoverage = istanbulLibCoverage.createFileCoverage('foo.js');
    fileCoverage.data = require('../fixtures/' + fixtureName + '.json');
    return fileCoverage;
}

describe('annotator', () => {
    describe('annotateSourceCode', () => {
        // see: https://github.com/istanbuljs/istanbul-reports/pull/10
        it('handles structuredText missing entry for startLine', () => {
            var annotated = annotator.annotateSourceCode(
                getFixture('github-10'),
                {
                    getSource() {
                        return '';
                    }
                }
            );
            annotated.annotatedCode[0].should.not.match(/Cannot read property/);
        });

        // see: https://github.com/istanbuljs/istanbul-reports/pull/11
        it('handles missing branch meta information', () => {
            var annotated = annotator.annotateSourceCode(
                getFixture('github-11'),
                {
                    getSource() {
                        return fs.readFileSync('index.js', 'utf-8');
                    }
                }
            );
            annotated.annotatedCode[0].should.not.match(/Cannot read property/);
        });

        // see: https://github.com/istanbuljs/istanbuljs/pull/80
        it('handles statement meta information with end column less than start column', () => {
            var annotated = annotator.annotateSourceCode(
                getFixture('github-80a'),
                {
                    getSource() {
                        return '  var test = "test";';
                    }
                }
            );
            annotated.annotatedCode[0].should.equal(
                '<span class="cstat-no" title="statement not covered" >  var test = "test";</span>'
            );
        });

        // see: https://github.com/istanbuljs/istanbuljs/pull/80
        it('handles function meta information with end column less than start column', () => {
            var annotated = annotator.annotateSourceCode(
                getFixture('github-80b'),
                {
                    getSource() {
                        return '  function test () {};';
                    }
                }
            );
            annotated.annotatedCode[0].should.equal(
                '<span class="fstat-no" title="function not covered" >  function test () {};</span>'
            );
        });

        // see: https://github.com/istanbuljs/istanbuljs/pull/80
        it('handles branch meta information with end column less than start column', () => {
            var annotated = annotator.annotateSourceCode(
                getFixture('github-80c'),
                {
                    getSource() {
                        return 'if (cond1 && cond2) {';
                    }
                }
            );
            annotated.annotatedCode[0].should.equal(
                'if (cond1 &amp;&amp; <span class="branch-0 cbranch-no" title="branch not covered" >cond2) {</span>'
            );
        });
    });
});
