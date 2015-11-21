/* globals describe, it */

var assert = require('chai').assert,
    cm = require('../lib/coverage-map'),
    CoverageMap = cm.CoverageMap,
    FileCoverage = require('../lib/file').FileCoverage;

describe('coverage map', function () {
    it('allows a noop constructor', function () {
        assert.doesNotThrow(function () {
            return new CoverageMap();
        });
    });
    it('allows a data object constructor', function () {
        assert.doesNotThrow(function () {
            return new CoverageMap({
                'foo.js': new FileCoverage('foo.js').data,
                'bar.js': new FileCoverage('bar.js').data
            });
        });
    });
    it('allows another coverage map in constructor', function () {
        assert.doesNotThrow(function () {
            return new CoverageMap(new CoverageMap({
                'foo.js': new FileCoverage('foo.js'),
                'bar.js': new FileCoverage('bar.js')
            }));
        });
    });
    it('merges another coverage map into itself', function () {
        var cm1 = new CoverageMap({
                'foo.js': new FileCoverage('foo.js'),
                'bar.js': new FileCoverage('bar.js')
            }),
            cm2 = new CoverageMap({
                'foo.js': new FileCoverage('foo.js'),
                'baz.js': new FileCoverage('baz.js')
            });
        cm1.merge(cm2);
        assert.equal(3, cm1.files().length);
        assert.deepEqual(['foo.js', 'bar.js', 'baz.js'], cm1.files());
    });
    it('merges coverage map data into itself', function () {
        var cm1 = new CoverageMap({
                'foo.js': new FileCoverage('foo.js'),
                'bar.js': new FileCoverage('bar.js')
            }),
            cm2 = new CoverageMap({
                'foo.js': new FileCoverage('foo.js'),
                'baz.js': new FileCoverage('baz.js')
            }).toJSON();
        cm1.merge(cm2);
        assert.equal(3, cm1.files().length);
        assert.deepEqual(['foo.js', 'bar.js', 'baz.js'], cm1.files());
    });
    it('returns file coverage for file', function () {
        var cm = new CoverageMap({
            'foo.js': new FileCoverage('foo.js'),
            'bar.js': new FileCoverage('bar.js')
        });
        assert.ok(cm.fileCoverageFor('foo.js'));
        assert.ok(cm.fileCoverageFor('bar.js'));
        assert.throws(function () {
            return cm.fileCoverageFor('baz.js');
        });
    });
    it('allows addition of new file coverage', function () {
        var cm = new CoverageMap({
            'foo.js': new FileCoverage('foo.js'),
            'bar.js': new FileCoverage('bar.js')
        });
        cm.addFileCoverage(new FileCoverage('foo.js'));
        cm.addFileCoverage(new FileCoverage('baz.js'));
        assert.equal(3, cm.files().length);
        assert.deepEqual(['foo.js', 'bar.js', 'baz.js'], cm.files());
    });
    it('returns coverage summary for all files', function () {
        var cm = new CoverageMap({
            'foo.js': new FileCoverage('foo.js'),
            'bar.js': new FileCoverage('bar.js')
        }),
            summary;
        cm.addFileCoverage(new FileCoverage('foo.js'));
        cm.addFileCoverage(new FileCoverage('baz.js'));
        summary = cm.getCoverageSummary();
        assert.ok(summary.statements);
        assert.ok(summary.statements.total === 0);
    });
});
