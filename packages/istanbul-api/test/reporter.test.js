/* globals context, describe, it */

const assert = require('chai').assert;
const coverage = require('istanbul-lib-coverage');
const configuration = require('../lib/config');
const Reporter = require('../lib/reporter');

describe('Reporter', () => {
    describe('#write', () => {
        context('config to exclude files is not defined', () => {
            const config = configuration.loadObject();

            it('does not exclude files from reports', done => {
                const coverageMap = coverage.createCoverageMap({});
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/a/b/c.js')
                );
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/d/e/f.js')
                );
                coverageMap.addFileCoverage(
                    coverage.createFileCoverage('/g/h/i.js')
                );

                const opts = {
                    summarizer(cm) {
                        assert.deepEqual(cm.files(), [
                            '/a/b/c.js',
                            '/d/e/f.js',
                            '/g/h/i.js'
                        ]);
                        done();
                    }
                };

                const reporter = new Reporter(config, opts);

                reporter.write(coverageMap);
            });
        });

        context('config to exclude files is defined', () => {
            const config = configuration.loadObject({
                instrumentation: {
                    excludes: ['**/a/**/*.js', '**/h/**/*.js']
                }
            });

            context('files to be excluded found', () => {
                const coverageMap = coverage.createCoverageMap();
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
                    const opts = {
                        summarizer(cm) {
                            assert.deepEqual(cm.files(), ['/d/e/f.js']);
                            done();
                        }
                    };

                    const reporter = new Reporter(config, opts);
                    reporter.write(coverageMap);
                });
            });

            context('files to be excluded not found', () => {
                const coverageMap = coverage.createCoverageMap();
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
                    const opts = {
                        summarizer(cm) {
                            assert.deepEqual(cm.files(), [
                                '/x/b/c.js',
                                '/d/e/f.js',
                                '/g/x/i.js'
                            ]);
                            done();
                        }
                    };

                    const reporter = new Reporter(config, opts);

                    reporter.write(coverageMap);
                });
            });
        });
    });
});
