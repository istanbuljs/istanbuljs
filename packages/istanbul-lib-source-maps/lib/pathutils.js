/*
 Copyright 2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

const path = require('path');

module.exports = {
    isAbsolute: path.isAbsolute,
    asAbsolute(file, baseDir) {
        return path.isAbsolute(file)
            ? file
            : path.resolve(baseDir || process.cwd(), file);
    },
    relativeTo(file, origFile) {
        if (path.isAbsolute(file)) {
            return file;
        }

        // Tools like webpack / vue-loader emit inline maps whose "sources"
        // are relative to the project root, while the coverage object is
        // keyed by the absolute path of the very same file. Resolving that
        // source against the directory of origFile would duplicate the
        // directory segments (src/components/src/components/file.vue, see
        // istanbuljs/nyc#718). When the relative source matches the
        // trailing path segments of origFile, it refers to origFile itself.
        const fileSegs = file.split(/[/\\]/).filter(seg => seg && seg !== '.');
        if (fileSegs.length > 0 && !fileSegs.includes('..')) {
            const origSegs = origFile.split(/[/\\]/).filter(Boolean);
            const tail = origSegs.slice(-fileSegs.length);
            if (
                tail.length === fileSegs.length &&
                tail.every((seg, i) => seg === fileSegs[i])
            ) {
                return origFile;
            }
        }

        return path.resolve(path.dirname(origFile), file);
    }
};
