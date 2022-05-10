'use strict';
/* globals describe, it */
const fs = require('fs');
const istanbulLibCoverage = require('istanbul-lib-coverage');
const annotator = require('../../lib/html/annotator');

require('chai').should();

function getFixture(fixtureName) {
    const fileCoverage = istanbulLibCoverage.createFileCoverage('foo.js');
    fileCoverage.data = require('../fixtures/' + fixtureName + '.json');
    return fileCoverage;
}

describe('annotator', () => {
    describe('annotateSourceCode', () => {
        // see: https://github.com/istanbuljs/istanbul-reports/pull/10
        it('handles structuredText missing entry for startLine', () => {
            const annotated = annotator(getFixture('github-10'), {
                getSource() {
                    return '';
                }
            });
            annotated.annotatedCode[0].should.not.match(/Cannot read property/);
        });

        // see: https://github.com/istanbuljs/istanbul-reports/pull/11
        it('handles missing branch meta information', () => {
            const annotated = annotator(getFixture('github-11'), {
                getSource() {
                    return fs.readFileSync('index.js', 'utf-8');
                }
            });
            annotated.annotatedCode[0].should.not.match(/Cannot read property/);
        });

        // see: https://github.com/istanbuljs/istanbuljs/pull/80
        it('handles statement meta information with end column less than start column', () => {
            const annotated = annotator(getFixture('github-80a'), {
                getSource() {
                    return '  var test = "test";';
                }
            });
            annotated.annotatedCode[0].should.equal(
                '<span class="cstat-no" title="statement not covered" >  var test = "test";</span>'
            );
        });

        // see: https://github.com/istanbuljs/istanbuljs/pull/80
        it('handles function meta information with end column less than start column', () => {
            const annotated = annotator(getFixture('github-80b'), {
                getSource() {
                    return '  function test () {};';
                }
            });
            annotated.annotatedCode[0].should.equal(
                '<span class="fstat-no" title="function not covered" >  function test () {};</span>'
            );
        });

        // see: https://github.com/istanbuljs/istanbuljs/pull/80
        it('handles branch meta information with end column less than start column', () => {
            const annotated = annotator(getFixture('github-80c'), {
                getSource() {
                    return 'if (cond1 && cond2) {';
                }
            });
            annotated.annotatedCode[0].should.equal(
                'if (cond1 &amp;&amp; <span class="branch-0 cbranch-no" title="branch not covered" >cond2) {</span>'
            );
        });

        // see: https://github.com/istanbuljs/istanbuljs/pull/322
        it('handles fnMap with missing decl', () => {
            const annotated = annotator(getFixture('github-322'), {
                getSource() {
                    return '  function test () {};';
                }
            });
            annotated.annotatedCode[0].should.equal(
                '<span class="fstat-no" title="function not covered" >  function test () {};</span>'
            );
        });

        // see: https://github.com/istanbuljs/istanbuljs/issues/649
        it('handles implicit else branches', () => {
            const annotated = annotator(getFixture('github-649'), {
                getSource() {
                    return `exports.testy = function () { 
                        let a = 0;
                      
                        if (!a) {
                          a = 3;
                        }
                    
                        return a;
                    };`;
                }
            });
            annotated.annotatedCode[3].should.equal(
                '    <span class="missing-if-branch" title="else path not taken" >E</span>                    if (!a) {'
            );
        });
    });
});
