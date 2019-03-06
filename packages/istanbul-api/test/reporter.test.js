/* globals context, describe, it */

var assert = require('chai').assert,
    configuration = require('../lib/config'),
    coverage = require('istanbul-lib-coverage'),
    Reporter = require('../lib/reporter');

describe('Reporter', function() {
    describe('#write', function() {
        context('config to exclude files is not defined', function() {
            var config = configuration.loadObject();

            it('does not exclude files from reports', function(done) {
                var coverageMap = coverage.createCoverageMap({});
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/a/b/c.js')
                );
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/d/e/f.js')
                );
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/g/h/i.js')
                );

                var opts = {
                    summarizer(cm) {
                        assert.deepEqual(cm.files(), [
                            '/a/b/c.js',
                            '/d/e/f.js',
                            '/g/h/i.js'
                        ]);
                        done();
                    }
                };

                var reporter = new Reporter(config, opts);

                reporter.write(coverageMap);
            });
        });

        context('config to exclude files is defined', function() {
            var config = configuration.loadObject({
                instrumentation: {
                    excludes: ['**/a/**/*.js', '**/h/**/*.js']
                }
            });

            context('files to be excluded found', function() {
                var coverageMap = coverage.createCoverageMap();
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/a/b/c.js')
                );
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/d/e/f.js')
                );
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/g/h/i.js')
                );

                it('excludes files from reports', function(done) {
                    var opts = {
                        summarizer(cm) {
                            assert.deepEqual(cm.files(), ['/d/e/f.js']);
                            done();
                        }
                    };

                    var reporter = new Reporter(config, opts);

                    reporter.write(coverageMap);
                });
            });

            context('files to be excluded not found', function() {
                var coverageMap = coverage.createCoverageMap();
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/x/b/c.js')
                );
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/d/e/f.js')
                );
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/g/x/i.js')
                );

                it('does not exclude files from reports', function(done) {
                    var opts = {
                        summarizer(cm) {
                            assert.deepEqual(cm.files(), [
                                '/x/b/c.js',
                                '/d/e/f.js',
                                '/g/x/i.js'
                            ]);
                            done();
                        }
                    };

                    var reporter = new Reporter(config, opts);

                    reporter.write(coverageMap);
                });
            });
        });
    });
});
