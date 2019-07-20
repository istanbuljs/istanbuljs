'use strict';

module.exports = {
    ...require('./monorepo-per-package-nycrc'),
    checkCoverage: true,
    lines: 100,
    statements: 100,
    functions: 100,
    branches: 100
};
