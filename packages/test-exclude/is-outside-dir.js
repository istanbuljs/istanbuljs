'use strict';

const path = require('path');

// istanbul ignore next
if (process.platform === 'win32') {
    module.exports = require('./is-outside-dir-win32');
} else {
    module.exports = require('./is-outside-dir-posix');
}
