#!/usr/bin/env node
'use strict';

const path = require('path');
const { spawnSync } = require('child_process');

const rimraf = require('rimraf');
const makeDir = require('make-dir');
const glob = require('glob');

process.chdir(__dirname);
rimraf.sync('.nyc_output');
makeDir.sync('.nyc_output');
// Merge coverage data from each package so we can generate a complete report
glob.sync('packages/*/.nyc_output').forEach(nycOutput => {
    const cwd = path.dirname(nycOutput);
    const { status, stderr } = spawnSync(
        'nyc',
        [
            'merge',
            '.nyc_output',
            path.join(__dirname, '.nyc_output', path.basename(cwd) + '.json')
        ],
        {
            encoding: 'utf8',
            shell: true,
            cwd
        }
    );

    if (status !== 0) {
        console.error(stderr);
        process.exit(status);
    }
});
