/* globals describe, it, beforeEach */

var assert = require('chai').assert;
var coverage = require('istanbul-lib-coverage');
var summarizer = require('../lib/summarizer');

function makeCoverage(filePath, numStatements, numCovered) {
    var fc = {
        path: filePath,
        statementMap: {},
        fnMap: {},
        branchMap: {},
        s: {},
        f: {},
        b: {}
    };
    var i;
    var index;

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
    var files = ['constructor.js', 'toString.js'];
    var count = 0;
    var map = {};
    files.forEach(f => {
        var filePath = dir ? dir + '/' + f : f;
        var fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

function singleDirMap(dir) {
    var files = ['file3.js', 'file4.js', 'file2.js', 'file1.js'];
    var count = 0;
    var map = {};
    files.forEach(f => {
        var filePath = dir ? dir + '/' + f : f;
        var fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

function twoDirMap(nested) {
    var files = nested
        ? [
              'lib1/file3.js',
              'lib1/lib2/file4.js',
              'lib1/file2.js',
              'lib1/lib2/file1.js'
          ]
        : ['lib1/file3.js', 'lib2/file4.js', 'lib1/file2.js', 'lib2/file1.js'];
    var count = 0;
    var map = {};
    files.forEach(f => {
        var filePath = f;
        var fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

function threeDirMap() {
    var files = [
        'lib1/file3.js',
        'lib2/file4.js',
        'lib1/sub/dir/file2.js',
        'file1.js'
    ];
    var count = 0;
    var map = {};
    files.forEach(f => {
        var filePath = f;
        var fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

function getStructure(tree, localNames) {
    var meth = localNames ? 'getRelativeName' : 'getQualifiedName';
    var visitor = {
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
    var fn;
    describe('[flat strategy]', () => {
        beforeEach(() => {
            fn = summarizer.createFlatSummary;
        });

        it('supports an empty coverage map', () => {
            var map = coverage.createCoverageMap({});
            var tree = fn(map);
            var nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('supports a list of files at top-level', () => {
            var map = singleDirMap();
            var tree = fn(map);
            var nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports a list of files containing Object.prototype names', () => {
            var map = protoDirMap();
            var tree = fn(map);
            var nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:constructor.js',
                'f:toString.js'
            ]);
        });

        it('supports a list of files at the same nesting level', () => {
            var map = singleDirMap('/lib/handlers');
            var tree = fn(map);
            var nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports 2 top-level dirs', () => {
            var map = twoDirMap();
            var tree = fn(map);
            var nodes = getStructure(tree);
            var localNodes = getStructure(tree, true);
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
            var map = twoDirMap(true);
            var tree = fn(map);
            var nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file2.js',
                'f:file3.js',
                'f:lib2/file1.js',
                'f:lib2/file4.js'
            ]);
        });

        it('supports 3 dirs, one nested 2 levels deep', () => {
            var map = threeDirMap();
            var tree = fn(map);
            var nodes = getStructure(tree);
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
            var map = coverage.createCoverageMap({});
            var tree = fn(map);
            var nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('supports a list of files at top-level', () => {
            var map = singleDirMap();
            var tree = fn(map);
            var nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports a list of files at the same nesting level', () => {
            var map = singleDirMap('/lib/handlers');
            var tree = fn(map);
            var nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports 2 top-level dirs', () => {
            var map = twoDirMap();
            var tree = fn(map);
            var nodes = getStructure(tree);
            var localNodes = getStructure(tree, true);
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
            var map = twoDirMap(true);
            var tree = fn(map);
            var nodes = getStructure(tree);
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
            var map = threeDirMap();
            var tree = fn(map);
            var nodes = getStructure(tree);
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
            var map = coverage.createCoverageMap({});
            var tree = fn(map);
            var nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('handles getting root node name without crashing when empty coverage map', () => {
            var map = coverage.createCoverageMap({});
            var tree = fn(map);
            var root = tree.getRoot();
            var rootNodeName = root.getRelativeName();
            assert.equal(rootNodeName, '');
        });

        it('supports a list of files at top-level', () => {
            var map = singleDirMap();
            var tree = fn(map);
            var nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports a list of files at the same nesting level', () => {
            var map = singleDirMap('/lib/handlers');
            var tree = fn(map);
            var nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:file1.js',
                'f:file2.js',
                'f:file3.js',
                'f:file4.js'
            ]);
        });

        it('supports 2 top-level dirs', () => {
            var map = twoDirMap();
            var tree = fn(map);
            var nodes = getStructure(tree);
            var localNodes = getStructure(tree, true);
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
            var map = twoDirMap(true);
            var tree = fn(map);
            var nodes = getStructure(tree);
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
            var map = threeDirMap();
            var tree = fn(map);
            var nodes = getStructure(tree);
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
            var map = threeDirMap();
            var tree = fn(map);
            var node = null;
            var visitor = {
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
            var map = threeDirMap();
            var tree = fn(map);
            var node = tree.getRoot();
            var s;

            assert.ok(node.isSummary());
            s = node.getCoverageSummary();
            assert.ok(s);
            assert.isNull(node.getCoverageSummary(true));
            assert.ok(s === node.getCoverageSummary()); //caching
        });
    });
});
