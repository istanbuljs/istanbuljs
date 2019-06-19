'use strict';

const base = require('../../monorepo-per-package-nycrc.json');
const defaultExclude = require('./default-exclude');

const isWindows = process.platform === 'win32';

module.exports = {
    ...base,
    exclude: [
        ...defaultExclude,
        'is-outside-dir.js',
        isWindows ? 'is-outside-dir-posix.js' : 'is-outside-dir-win32.js'
    ],
    checkCoverage: true,
    lines: 100,
    statements: 100,
    functions: 100,
    branches: 100
};
