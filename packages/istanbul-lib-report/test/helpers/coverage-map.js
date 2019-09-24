'use strict';

const coverage = require('istanbul-lib-coverage');

function makeCoverage(filePath, numStatements, numCovered) {
    const fc = {
        path: filePath,
        statementMap: {},
        fnMap: {},
        branchMap: {},
        s: {},
        f: {},
        b: {}
    };
    let i;
    let index;

    for (i = 0; i < numStatements; i += 1) {
        index = i + 1;
        fc.statementMap[index] = {
            start: { line: i + 1, column: 0 },
            end: { line: i + 1, column: 100 }
        };
        if (i < numCovered) {
            fc.s[index] = 1;
        }
    }
    return fc;
}

function filesMap(dir, files) {
    if (!dir) {
        dir = '';
    } else if (dir !== '/') {
        dir = dir + '/';
    }

    let count = 0;

    return coverage.createCoverageMap(
        files.reduce((map, file) => {
            const filePath = dir + file;
            map[filePath] = makeCoverage(filePath, 4, count);
            count += 1;

            return map;
        }, {})
    );
}

function protoDir(dir) {
    return filesMap(dir, ['constructor.js', 'toString.js']);
}

function singleDir(dir) {
    return filesMap(dir, ['file3.js', 'file4.js', 'file2.js', 'file1.js']);
}

function twoDir(nested) {
    return filesMap('', [
        'lib1/file3.js',
        nested ? 'lib1/lib2/file4.js' : 'lib2/file4.js',
        'lib1/file2.js',
        nested ? 'lib1/lib2/file1.js' : 'lib2/file1.js'
    ]);
}

function threeDir() {
    return filesMap('', [
        'lib1/file3.js',
        'lib2/file4.js',
        'lib1/sub/dir/file2.js',
        'file1.js'
    ]);
}

function multiDir() {
    return filesMap('', [
        'lib1/sub/file3.js',
        'lib1/file4.js',
        'lib2/sub1/file2.js',
        'lib2/sub2/file1.js'
    ]);
}

module.exports = {
    empty: coverage.createCoverageMap({}),
    protoDir,
    singleDir,
    twoDir,
    threeDir,
    multiDir
};
