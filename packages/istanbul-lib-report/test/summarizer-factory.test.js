'use strict';
/* globals describe, it, beforeEach */

const assert = require('chai').assert;
const SummarizerFactory = require('../lib/summarizer-factory');
const coverageMap = require('./helpers/coverage-map');

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

    it('caches summarizer', () => {
        const factory = new SummarizerFactory(coverageMap.empty);
        assert.strictEqual(factory.pkg, factory.pkg);
        assert.strictEqual(factory.nested, factory.nested);
        assert.strictEqual(factory.flat, factory.flat);
    });

    describe('[flat strategy]', () => {
        beforeEach(() => {
            fn = coverageMap => new SummarizerFactory(coverageMap).flat;
        });

        it('supports an empty coverage map', () => {
            const map = coverageMap.empty;
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('supports a list of files at top-level', () => {
            const map = coverageMap.singleDir();
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
            const map = coverageMap.protoDir();
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'f:constructor.js',
                'f:toString.js'
            ]);
        });

        it('supports a list of files at the same nesting level', () => {
            const map = coverageMap.singleDir('/lib/handlers');
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
            const map = coverageMap.twoDir();
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
            const map = coverageMap.twoDir(true);
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
            const map = coverageMap.threeDir();
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
            fn = coverageMap => new SummarizerFactory(coverageMap).pkg;
        });

        it('supports an empty coverage map', () => {
            const map = coverageMap.empty;
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('supports a list of files at top-level', () => {
            const map = coverageMap.singleDir();
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
            const map = coverageMap.singleDir('/lib/handlers');
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
            const map = coverageMap.twoDir();
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
            const map = coverageMap.twoDir(true);
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
            const map = coverageMap.threeDir();
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
            fn = coverageMap => new SummarizerFactory(coverageMap).nested;
        });

        it('supports an empty coverage map', () => {
            const map = coverageMap.empty;
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, ['g:']);
        });

        it('handles getting root node name without crashing when empty coverage map', () => {
            const map = coverageMap.empty;
            const tree = fn(map);
            const root = tree.getRoot();
            const rootNodeName = root.getRelativeName();
            assert.equal(rootNodeName, '');
        });

        it('supports a list of files at top-level', () => {
            const map = coverageMap.singleDir();
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
            const map = coverageMap.singleDir('/lib/handlers');
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
            const map = coverageMap.twoDir();
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
            const map = coverageMap.twoDir(true);
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
            const map = coverageMap.threeDir();
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
        it('supports directory in directory', () => {
            const map = coverageMap.multiDir();
            const tree = fn(map);
            const nodes = getStructure(tree);
            assert.deepEqual(nodes, [
                'g:',
                'g:lib1',
                'f:lib1/file4.js',
                'g:lib1/sub',
                'f:lib1/sub/file3.js',
                'g:lib2',
                'g:lib2/sub1',
                'f:lib2/sub1/file2.js',
                'g:lib2/sub2',
                'f:lib2/sub2/file1.js'
            ]);
        });
    });

    describe('report node properties', () => {
        beforeEach(() => {
            fn = coverageMap => new SummarizerFactory(coverageMap).pkg;
        });

        it('asRelative results', () => {
            const map = coverageMap.threeDir();
            const tree = fn(map);
            let node = null;
            const visitor = {
                onDetail(n) {
                    node = n;
                }
            };
            tree.visit(visitor);
            assert.strictEqual(node.asRelative('/dir/path.js'), 'dir/path.js');
            assert.strictEqual(node.asRelative('dir/path.js'), 'dir/path.js');
        });

        it('provides file coverage for leaf nodes', () => {
            const map = coverageMap.threeDir();
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
            const map = coverageMap.threeDir();
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
