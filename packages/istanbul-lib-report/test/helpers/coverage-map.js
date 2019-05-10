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

function protoDir(dir) {
    const files = ['constructor.js', 'toString.js'];
    let count = 0;
    const map = {};
    files.forEach(f => {
        const filePath = dir ? dir + '/' + f : f;
        const fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

function singleDir(dir) {
    const files = ['file3.js', 'file4.js', 'file2.js', 'file1.js'];
    let count = 0;
    const map = {};
    files.forEach(f => {
        const filePath = dir ? dir + '/' + f : f;
        const fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

function twoDir(nested) {
    const files = nested
        ? [
              'lib1/file3.js',
              'lib1/lib2/file4.js',
              'lib1/file2.js',
              'lib1/lib2/file1.js'
          ]
        : ['lib1/file3.js', 'lib2/file4.js', 'lib1/file2.js', 'lib2/file1.js'];
    let count = 0;
    const map = {};
    files.forEach(f => {
        const filePath = f;
        const fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

function threeDir() {
    const files = [
        'lib1/file3.js',
        'lib2/file4.js',
        'lib1/sub/dir/file2.js',
        'file1.js'
    ];
    let count = 0;
    const map = {};
    files.forEach(f => {
        const filePath = f;
        const fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

function multiDir() {
    const files = [
        'lib1/sub/file3.js',
        'lib1/file4.js',
        'lib2/sub1/file2.js',
        'lib2/sub2/file1.js'
    ];
    let count = 0;
    const map = {};
    files.forEach(f => {
        const filePath = f;
        const fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

module.exports = {
    empty: coverage.createCoverageMap({}),
    protoDir,
    singleDir,
    twoDir,
    threeDir,
    multiDir
};
