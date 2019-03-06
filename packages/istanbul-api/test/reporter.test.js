/* globals context, describe, it */

var assert = require('chai').assert;
var configuration = require('../lib/config');
var coverage = require('istanbul-lib-coverage');
var Reporter = require('../lib/reporter');

describe('Reporter', () => {
    describe('#write', () => {
        context('config to exclude files is not defined', () => {
            var config = configuration.loadObject();

            it('does not exclude files from reports', done => {
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

        context('config to exclude files is defined', () => {
            var config = configuration.loadObject({
                instrumentation: {
                    excludes: ['**/a/**/*.js', '**/h/**/*.js']
                }
            });

            context('files to be excluded found', () => {
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

                it('excludes files from reports', done => {
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

            context('files to be excluded not found', () => {
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

                it('does not exclude files from reports', done => {
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
