/* globals describe, it, beforeEach */

const assert = require('chai').assert;
const coverage = require('istanbul-lib-coverage');
const summarizer = require('../lib/summarizer');

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

function protoDirMap(dir) {
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

function singleDirMap(dir) {
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

function twoDirMap(nested) {
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

function threeDirMap() {
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

function getStructure(tree, localNames) {
    const meth = localNames ? 'getRelativeName' : 'getQualifiedName';
    const visitor = {
        nodes: [],
        onSummary(node) {
            this.nodes.push('g:' + node[meth]());
        },
        onDetail(node) {
            this.nodes.push('f:' + node[meth]());
        }
    };
    tree.visit(visitor);
    return visitor.nodes;
}

describe('summarizer', () => {
    let fn;
    describe('[flat strategy]', () => {
        beforeEach(() => {
            fn = summarizer.createFlatSummary;
        });

        it('supports an empty coverage map', () => {
            const map = coverage.createCoverageMap({});
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('supports a list of files at top-level', () => {
            const map = singleDirMap();
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports a list of files containing Object.prototype names', () => {
            const map = protoDirMap();
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:constructor.js',
                'f:toString.js'
            ]);
        });

        it('supports a list of files at the same nesting level', () => {
            const map = singleDirMap('/lib/handlers');
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports 2 top-level dirs', () => {
            const map = twoDirMap();
            const tree = fn(map);
            const nodes = getStructure(tree);
            const localNodes = getStructure(tree, true);
            assert.deepEqual(nodes, [
                'g:',
                'f:lib1/file2.js',
                'f:lib1/file3.js',
                'f:lib2/file1.js',
                'f:lib2/file4.js'
            ]);
            assert.deepEqual(localNodes, [
                'g:',
                'f:lib1/file2.js',
                'f:lib1/file3.js',
                'f:lib2/file1.js',
                'f:lib2/file4.js'
            ]);
        });

        it('supports 2 dirs one under another', () => {
            const map = twoDirMap(true);
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file2.js',
                'f:file3.js',
                'f:lib2/file1.js',
                'f:lib2/file4.js'
            ]);
        });

        it('supports 3 dirs, one nested 2 levels deep', () => {
            const map = threeDirMap();
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:lib1/file3.js',
                'f:lib1/sub/dir/file2.js',
                'f:lib2/file4.js'
            ]);
        });
    });

    describe('[package strategy]', () => {
        beforeEach(() => {
            fn = summarizer.createPackageSummary;
        });

        it('supports an empty coverage map', () => {
            const map = coverage.createCoverageMap({});
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('supports a list of files at top-level', () => {
            const map = singleDirMap();
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports a list of files at the same nesting level', () => {
            const map = singleDirMap('/lib/handlers');
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports 2 top-level dirs', () => {
            const map = twoDirMap();
            const tree = fn(map);
            const nodes = getStructure(tree);
            const localNodes = getStructure(tree, true);
            assert.deepEqual(nodes, [
                'g:',
                'g:lib1',
                'f:lib1/file2.js',
                'f:lib1/file3.js',
                'g:lib2',
                'f:lib2/file1.js',
                'f:lib2/file4.js'
            ]);
            assert.deepEqual(localNodes, [
                'g:',
                'g:lib1',
                'f:file2.js',
                'f:file3.js',
                'g:lib2',
                'f:file1.js',
                'f:file4.js'
            ]);
        });

        it('supports 2 dirs one under another', () => {
            const map = twoDirMap(true);
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'g:lib1',
                'f:lib1/file2.js',
                'f:lib1/file3.js',
                'g:lib1/lib2',
                'f:lib1/lib2/file1.js',
                'f:lib1/lib2/file4.js'
            ]);
        });

        it('supports 3 dirs, one nested 2 levels deep', () => {
            const map = threeDirMap();
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'g:root',
                'f:root/file1.js',
                'g:root/lib1',
                'f:root/lib1/file3.js',
                'g:root/lib1/sub/dir',
                'f:root/lib1/sub/dir/file2.js',
                'g:root/lib2',
                'f:root/lib2/file4.js'
            ]);
        });
    });

    describe('[nested strategy]', () => {
        beforeEach(() => {
            fn = summarizer.createNestedSummary;
        });

        it('supports an empty coverage map', () => {
            const map = coverage.createCoverageMap({});
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('handles getting root node name without crashing when empty coverage map', () => {
            const map = coverage.createCoverageMap({});
            const tree = fn(map);
            const root = tree.getRoot();
            const rootNodeName = root.getRelativeName();
            assert.equal(rootNodeName, '');
        });

        it('supports a list of files at top-level', () => {
            const map = singleDirMap();
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports a list of files at the same nesting level', () => {
            const map = singleDirMap('/lib/handlers');
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports 2 top-level dirs', () => {
            const map = twoDirMap();
            const tree = fn(map);
            const nodes = getStructure(tree);
            const localNodes = getStructure(tree, true);
            assert.deepEqual(nodes, [
                'g:',
                'g:lib1',
                'f:lib1/file2.js',
                'f:lib1/file3.js',
                'g:lib2',
                'f:lib2/file1.js',
                'f:lib2/file4.js'
            ]);
            assert.deepEqual(localNodes, [
                'g:',
                'g:lib1',
                'f:file2.js',
                'f:file3.js',
                'g:lib2',
                'f:file1.js',
                'f:file4.js'
            ]);
        });

        it('supports 2 dirs one under another', () => {
            const map = twoDirMap(true);
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file2.js',
                'f:file3.js',
                'g:lib2',
                'f:lib2/file1.js',
                'f:lib2/file4.js'
            ]);
        });
        it('supports 3 dirs, one nested 2 levels deep', () => {
            const map = threeDirMap();
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'g:lib1',
                'f:lib1/file3.js',
                'g:lib1/sub/dir',
                'f:lib1/sub/dir/file2.js',
                'g:lib2',
                'f:lib2/file4.js'
            ]);
        });
    });

    describe('report node properties', () => {
        beforeEach(() => {
            fn = summarizer.createPackageSummary;
        });

        it('provides file coverage for leaf nodes', () => {
            const map = threeDirMap();
            const tree = fn(map);
            let node = null;
            const visitor = {
                onDetail(n) {
                    node = n;
                }
            };

            tree.visit(visitor);
            assert.ok(!node.isSummary());
            assert.ok(node.getFileCoverage());
            assert.ok(node.getCoverageSummary());
        });

        it('provides summary coverage for group nodes w and w/o files', () => {
            const map = threeDirMap();
            const tree = fn(map);
            const node = tree.getRoot();

            assert.ok(node.isSummary());

            const s = node.getCoverageSummary();
            assert.ok(s);
            assert.isNull(node.getCoverageSummary(true));
            assert.ok(s === node.getCoverageSummary()); //caching
        });
    });
});
