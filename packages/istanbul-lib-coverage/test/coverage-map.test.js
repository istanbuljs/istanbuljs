'use strict';
/* globals describe, it */

const assert = require('chai').assert;
const { CoverageMap } = require('../lib/coverage-map');
const { FileCoverage } = require('../lib/file-coverage');

describe('coverage map', () => {
    it('allows a noop constructor', () => {
        assert.doesNotThrow(() => new CoverageMap());
    });
    it('allows a data object constructor', () => {
        assert.doesNotThrow(
            () =>
                new CoverageMap({
                    'foo.js': new FileCoverage('foo.js').data,
                    'bar.js': new FileCoverage('bar.js').data
                })
        );
    });
    it('allows another coverage map in constructor', () => {
        assert.doesNotThrow(
            () =>
                new CoverageMap(
                    new CoverageMap({
                        'foo.js': new FileCoverage('foo.js'),
                        'bar.js': new FileCoverage('bar.js')
                    })
                )
        );
    });
    it('merges another coverage map into itself', () => {
        const cm1 = new CoverageMap({
            'foo.js': new FileCoverage('foo.js'),
            'bar.js': new FileCoverage('bar.js')
        });
        const cm2 = new CoverageMap({
            'foo.js': new FileCoverage('foo.js'),
            'baz.js': new FileCoverage('baz.js')
        });
        cm1.merge(cm2);
        assert.equal(3, cm1.files().length);
        assert.deepEqual(['foo.js', 'bar.js', 'baz.js'], cm1.files());
    });
    it('merges coverage map data into itself', () => {
        const cm1 = new CoverageMap({
            'foo.js': new FileCoverage('foo.js'),
            'bar.js': new FileCoverage('bar.js')
        });
        const cm2 = new CoverageMap({
            'foo.js': new FileCoverage('foo.js'),
            'baz.js': new FileCoverage('baz.js')
        }).toJSON();
        cm1.merge(cm2);
        assert.equal(3, cm1.files().length);
        assert.deepEqual(['foo.js', 'bar.js', 'baz.js'], cm1.files());
    });
    it('returns file coverage for file', () => {
        const cm = new CoverageMap({
            'foo.js': new FileCoverage('foo.js'),
            'bar.js': new FileCoverage('bar.js')
        });
        assert.ok(cm.fileCoverageFor('foo.js'));
        assert.ok(cm.fileCoverageFor('bar.js'));
        assert.throws(() => cm.fileCoverageFor('baz.js'));
    });
    it('allows addition of new file coverage', () => {
        const cm = new CoverageMap({
            'foo.js': new FileCoverage('foo.js'),
            'bar.js': new FileCoverage('bar.js')
        });
        cm.addFileCoverage(new FileCoverage('foo.js'));
        cm.addFileCoverage(new FileCoverage('baz.js'));
        assert.equal(3, cm.files().length);
        assert.deepEqual(['foo.js', 'bar.js', 'baz.js'], cm.files());
    });
    it('can filter file coverage', () => {
        const cm = new CoverageMap({
            'foo.js': new FileCoverage('foo.js'),
            'bar.js': new FileCoverage('bar.js')
        });
        assert.deepEqual(['foo.js', 'bar.js'], cm.files());
        cm.filter(file => file === 'foo.js');
        assert.deepEqual(['foo.js'], cm.files());
    });
    it('returns coverage summary for all files', () => {
        const cm = new CoverageMap({
            'foo.js': new FileCoverage('foo.js'),
            'bar.js': new FileCoverage('bar.js')
        });
        cm.addFileCoverage(new FileCoverage('foo.js'));
        cm.addFileCoverage(new FileCoverage('baz.js'));
        const summary = cm.getCoverageSummary();
        assert.ok(summary.statements);
        assert.ok(summary.statements.total === 0);
    });
});
