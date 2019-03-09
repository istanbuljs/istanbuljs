'use strict';

const semver = require('semver');

module.exports = {
    'hook-require': !semver.lt(process.version, '11.11.0'),
    'hook-run-in-this-context': true
};
