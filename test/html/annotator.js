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
  });
});
