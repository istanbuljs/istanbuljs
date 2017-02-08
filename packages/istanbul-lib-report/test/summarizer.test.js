/* globals describe, it, beforeEach */

var assert = require('chai').assert,
    coverage = require('istanbul-lib-coverage'),
    summarizer = require('../lib/summarizer');

function makeCoverage(filePath, numStatements, numCovered) {
    var fc = {
        path: filePath,
        statementMap: {},
        fnMap: {},
        branchMap: {},
        s: {},
        f: {},
        b: {}
        },
        i,
        index;

    for (i = 0; i < numStatements; i += 1) {
        index = i + 1;
        fc.statementMap[index] = {
            start: {line: i + 1, column: 0},
            end: {line: i + 1, column: 100}
        };
        if (i < numCovered) {
            fc.s[index] = 1;
        }
    }
    return fc;
}

function singleDirMap(dir) {
    var files = ['file3.js', 'file4.js', 'file2.js', 'file1.js'],
        count = 0,
        map = {};
    files.forEach(function (f) {
        var filePath = dir ? dir + '/' + f : f,
            fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

function twoDirMap(nested) {
    var files = nested ?
            ['lib1/file3.js', 'lib1/lib2/file4.js', 'lib1/file2.js', 'lib1/lib2/file1.js'] :
            ['lib1/file3.js', 'lib2/file4.js', 'lib1/file2.js', 'lib2/file1.js'],
        count = 0,
        map = {};
    files.forEach(function (f) {
        var filePath = f,
            fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

function threeDirMap() {
    var files = ['lib1/file3.js', 'lib2/file4.js', 'lib1/sub/dir/file2.js', 'file1.js'],
        count = 0,
        map = {};
    files.forEach(function (f) {
        var filePath = f,
            fc = makeCoverage(filePath, 4, count);
        count += 1;
        map[filePath] = fc;
    });
    return coverage.createCoverageMap(map);
}

function getStructure(tree, localNames) {
    var meth = localNames ? 'getRelativeName' : 'getQualifiedName',
        visitor = {
        nodes: [],
        onSummary: function (node) {
            this.nodes.push('g:' + node[meth]());
        },
        onDetail: function (node) {
            this.nodes.push('f:' + node[meth]());
        }
    };
    tree.visit(visitor);
    return visitor.nodes;
}

describe('summarizer', function () {
    var fn;
    describe('[flat strategy]', function () {
        beforeEach(function () {
            fn = summarizer.createFlatSummary;
        });

        it('supports an empty coverage map', function () {
            var map = coverage.createCoverageMap({}),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('supports a list of files at top-level', function () {
            var map = singleDirMap(),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:', 'f:file1.js', 'f:file2.js', 'f:file3.js', 'f:file4.js']);
        });

        it('supports a list of files at the same nesting level', function () {
            var map = singleDirMap('/lib/handlers'),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:', 'f:file1.js', 'f:file2.js', 'f:file3.js', 'f:file4.js']);
        });

        it('supports 2 top-level dirs', function () {
            var map = twoDirMap(),
                tree = fn(map),
                nodes = getStructure(tree),
                localNodes = getStructure(tree, true);
            assert.deepEqual(nodes, ['g:', 'f:lib1/file2.js', 'f:lib1/file3.js', 'f:lib2/file1.js', 'f:lib2/file4.js']);
            assert.deepEqual(localNodes, ['g:', 'f:lib1/file2.js', 'f:lib1/file3.js', 'f:lib2/file1.js', 'f:lib2/file4.js']);
        });

        it('supports 2 dirs one under another', function () {
            var map = twoDirMap(true),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:', 'f:file2.js', 'f:file3.js', 'f:lib2/file1.js', 'f:lib2/file4.js']);
        });

        it('supports 3 dirs, one nested 2 levels deep', function () {
            var map = threeDirMap(),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:',
                'f:file1.js',
                'f:lib1/file3.js',
                'f:lib1/sub/dir/file2.js',
                'f:lib2/file4.js'
            ]);
        });
    });

    describe('[package strategy]', function () {
        beforeEach(function () {
            fn = summarizer.createPackageSummary;
        });

        it('supports an empty coverage map', function () {
            var map = coverage.createCoverageMap({}),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('supports a list of files at top-level', function () {
            var map = singleDirMap(),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:', 'f:file1.js', 'f:file2.js', 'f:file3.js', 'f:file4.js']);
        });

        it('supports a list of files at the same nesting level', function () {
            var map = singleDirMap('/lib/handlers'),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:', 'f:file1.js', 'f:file2.js', 'f:file3.js', 'f:file4.js']);
        });

        it('supports 2 top-level dirs', function () {
            var map = twoDirMap(),
                tree = fn(map),
                nodes = getStructure(tree),
                localNodes = getStructure(tree, true);
            assert.deepEqual(nodes, ['g:', 'g:lib1', 'f:lib1/file2.js', 'f:lib1/file3.js', 'g:lib2', 'f:lib2/file1.js', 'f:lib2/file4.js']);
            assert.deepEqual(localNodes, ['g:', 'g:lib1', 'f:file2.js', 'f:file3.js', 'g:lib2', 'f:file1.js', 'f:file4.js']);
        });

        it('supports 2 dirs one under another', function () {
            var map = twoDirMap(true),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'g:lib1', 'f:lib1/file2.js', 'f:lib1/file3.js',
                'g:lib1/lib2', 'f:lib1/lib2/file1.js', 'f:lib1/lib2/file4.js'
            ]);
        });

        it('supports 3 dirs, one nested 2 levels deep', function () {
            var map = threeDirMap(),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:',
                'g:root', 'f:root/file1.js',
                'g:root/lib1', 'f:root/lib1/file3.js',
                'g:root/lib1/sub/dir', 'f:root/lib1/sub/dir/file2.js',
                'g:root/lib2', 'f:root/lib2/file4.js'
            ]);
        });
    });

    describe('[nested strategy]', function () {
        beforeEach(function () {
            fn = summarizer.createNestedSummary;
        });

        it('supports an empty coverage map', function () {
            var map = coverage.createCoverageMap({}),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('supports a list of files at top-level', function () {
            var map = singleDirMap(),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:', 'f:file1.js', 'f:file2.js', 'f:file3.js', 'f:file4.js']);
        });

        it('supports a list of files at the same nesting level', function () {
            var map = singleDirMap('/lib/handlers'),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:', 'f:file1.js', 'f:file2.js', 'f:file3.js', 'f:file4.js']);
        });

        it('supports 2 top-level dirs', function () {
            var map = twoDirMap(),
                tree = fn(map),
                nodes = getStructure(tree),
                localNodes = getStructure(tree, true);
            assert.deepEqual(nodes, ['g:', 'g:lib1', 'f:lib1/file2.js', 'f:lib1/file3.js', 'g:lib2', 'f:lib2/file1.js', 'f:lib2/file4.js']);
            assert.deepEqual(localNodes, ['g:', 'g:lib1', 'f:file2.js', 'f:file3.js', 'g:lib2', 'f:file1.js', 'f:file4.js']);
        });

        it('supports 2 dirs one under another', function () {
            var map = twoDirMap(true),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:', 'f:file2.js', 'f:file3.js', 'g:lib2', 'f:lib2/file1.js', 'f:lib2/file4.js']);
        });
        it('supports 3 dirs, one nested 2 levels deep', function () {
            var map = threeDirMap(),
                tree = fn(map),
                nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:', 'f:file1.js',
                'g:lib1', 'f:lib1/file3.js',
                'g:lib1/sub/dir', 'f:lib1/sub/dir/file2.js',
                'g:lib2', 'f:lib2/file4.js'
            ]);
        });
    });

    describe('report node properties', function () {
        beforeEach(function () {
            fn = summarizer.createPackageSummary;
        });

        it('provides file coverage for leaf nodes', function () {
            var map = threeDirMap(),
                tree = fn(map),
                node = null,
                visitor = {
                   onDetail: function (n) {
                       node = n;
                   }
                };

            tree.visit(visitor);
            assert.ok(!node.isSummary());
            assert.ok(node.getFileCoverage());
            assert.ok(node.getCoverageSummary());
        });

        it('provides summary coverage for group nodes w and w/o files', function () {
            var map = threeDirMap(),
                tree = fn(map),
                node = tree.getRoot(),
                s;

            assert.ok(node.isSummary());
            s = node.getCoverageSummary();
            assert.ok(s);
            assert.isNull(node.getCoverageSummary(true));
            assert.ok(s === node.getCoverageSummary()); //caching
        });
    });
});