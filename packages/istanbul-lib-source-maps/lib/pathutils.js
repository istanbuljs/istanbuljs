/*
 Copyright 2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

const path = require('path');
const url = require('url');

module.exports = {
    isAbsolute: path.isAbsolute,
    asAbsolute(file, baseDir) {
        file = url.fileURLToPath(file)
        return path.isAbsolute(file)
            ? file
            : path.resolve(baseDir || process.cwd(), file);
    },
    relativeTo(file, origFile) {
        file = url.fileURLToPath(file)
        return path.isAbsolute(file)
            ? file
            : path.resolve(path.dirname(origFile), file);
    }
};
