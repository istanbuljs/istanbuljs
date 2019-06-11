'use strict';

const devConfigs = ['ava', 'babel', 'jest', 'nyc', 'rollup', 'webpack'];

module.exports = [
    'coverage/**',
    'packages/*/test{,s}/**',
    'test{,s}/**',
    'test{,-*}.{js,cjs,mjs,ts}',
    '**/*{.,-}test.{js,cjs,mjs,ts}',
    '**/__tests__/**',
    `**/{${devConfigs.join()}}.config.js`
];
