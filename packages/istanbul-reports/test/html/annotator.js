/* globals describe, it */
var fs = require('fs'),
    annotator = require('../../lib/html/annotator'),
    istanbulLibCoverage = require('istanbul-lib-coverage');

require('chai').should();

function getFixture (fixtureName) {
  var fileCoverage = istanbulLibCoverage.createFileCoverage('foo.js');
  fileCoverage.data = require('../fixtures/' + fixtureName + '.json');
  return fileCoverage;
}

describe('annotator', function () {
  describe('annotateSourceCode', function () {
    // see: https://github.com/istanbuljs/istanbul-reports/pull/10
    it('handles structuredText missing entry for startLine', function () {
      var annotated = annotator.annotateSourceCode(getFixture('github-10'), {
        getSource: function () {
          return '';
        }
      });
      annotated.annotatedCode[0].should.not.match(/Cannot read property/);
    });

    // see: https://github.com/istanbuljs/istanbul-reports/pull/11
    it('handles missing branch meta information', function () {
      var annotated = annotator.annotateSourceCode(getFixture('github-11'), {
        getSource: function () {
          return fs.readFileSync('index.js', 'utf-8');
        }
      });
      annotated.annotatedCode[0].should.not.match(/Cannot read property/);
    });

    // see: https://github.com/istanbuljs/istanbuljs/pull/80
    it('handles statement meta information with end column less than start column', function () {
      var annotated = annotator.annotateSourceCode(getFixture('github-80a'), {
        getSource: function () {
          return '  var test = "test";';
        }
      });
      annotated.annotatedCode[0].should
        .equal('<span class="cstat-no" title="statement not covered" >  var test = "test";</span>');
    });

    // see: https://github.com/istanbuljs/istanbuljs/pull/80
    it('handles function meta information with end column less than start column', function () {
      var annotated = annotator.annotateSourceCode(getFixture('github-80b'), {
        getSource: function () {
          return '  function test () {};';
        }
      });
      annotated.annotatedCode[0].should
        .equal('<span class="fstat-no" title="function not covered" >  function test () {};</span>');
    });

    // see: https://github.com/istanbuljs/istanbuljs/pull/80
    it('handles branch meta information with end column less than start column', function () {
      var annotated = annotator.annotateSourceCode(getFixture('github-80c'), {
        getSource: function () {
          return 'if (cond1 && cond2) {';
        }
      });
      annotated.annotatedCode[0].should
        .equal('if (cond1 &amp;&amp; <span class="branch-0 cbranch-no" title="branch not covered" >cond2) {</span>');
    });
  });
});
