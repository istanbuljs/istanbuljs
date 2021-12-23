'use strict';
/* globals describe, it */
const assert = require('chai').assert;
const getChildData = require('../../../lib/html-spa/src/getChildData');

const mediumMetrics = {
    statements: {
        total: 2100,
        covered: 1337,
        missed: 2100 - 1337,
        skipped: 0,
        pct: 63.67,
        classForPercent: 'medium'
    },
    branches: {
        total: 983,
        covered: 606,
        missed: 983 - 606,
        skipped: 0,
        pct: 61.65,
        classForPercent: 'medium'
    },
    functions: {
        total: 476,
        covered: 312,
        missed: 476 - 312,
        skipped: 0,
        pct: 65.55,
        classForPercent: 'medium'
    },
    lines: {
        total: 2044,
        covered: 1313,
        missed: 2044 - 1313,
        skipped: 0,
        pct: 64.24,
        classForPercent: 'medium'
    }
};

const simpleSourceData = {
    file: '',
    isEmpty: false,
    metrics: mediumMetrics,
    children: [
        {
            file: 'istanbul-lib-coverage',
            isEmpty: false,
            metrics: mediumMetrics,
            children: [
                {
                    file: 'index.js',
                    isEmpty: false,
                    metrics: mediumMetrics
                }
            ]
        }
    ]
};

describe('getChildData', () => {
    it('does nothing if not asked to', () => {
        assert.deepEqual(
            getChildData(
                simpleSourceData,
                { lines: true, branches: true },
                null,
                false,
                { low: true, medium: true, high: true },
                null
            ),
            simpleSourceData.children
        );
    });
});
