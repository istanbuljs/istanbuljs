'use strict';
/* globals describe, it, beforeEach */

const assert = require('chai').assert;
const {
    BaseTree,
    BaseNode,
    Visitor,
    CompositeVisitor
} = require('../lib/tree');

class TestNode extends BaseNode {
    constructor(name) {
        super();

        this.name = name;
        this.parent = null;
        this.children = [];
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }

    getChildren() {
        return this.children;
    }

    isRoot() {
        return this.parent === null;
    }

    isSummary() {
        return this.children.length > 0;
    }
}

describe('tree', () => {
    let leaves;
    let groups;
    let tree;

    beforeEach(() => {
        leaves = [
            new TestNode('l1'),
            new TestNode('l2'),
            new TestNode('l3'),
            new TestNode('l4'),
            new TestNode('l5'),
            new TestNode('l6'),
            new TestNode('l7')
        ];
        groups = [new TestNode('g1'), new TestNode('g2'), new TestNode('g3')];
        groups[0].addChild(groups[1]);
        groups[1].addChild(leaves[0]);
        groups[1].addChild(leaves[1]);
        groups[1].addChild(leaves[2]);
        groups[0].addChild(leaves[3]);
        groups[2].addChild(leaves[4]);
        groups[2].addChild(leaves[5]);
        groups[2].addChild(leaves[6]);

        const root = new TestNode('root');
        root.addChild(groups[0]);
        root.addChild(groups[2]);
        tree = new BaseTree(root);
    });

    describe('single visitor', () => {
        it('visits all nodes with correct state with a full visitor', () => {
            const visited = [];
            const visitor = new Visitor({
                onStart(node, state) {
                    state.push('start');
                },
                onEnd(node, state) {
                    state.push('end');
                },
                onSummary(node, state) {
                    state.push(node.name);
                },
                onDetail(node, state) {
                    state.push(node.name);
                }
            });
            tree.visit(visitor, visited);
            assert.deepEqual(visited, [
                'start',
                'root',
                'g1',
                'g2',
                'l1',
                'l2',
                'l3',
                'l4',
                'g3',
                'l5',
                'l6',
                'l7',
                'end'
            ]);
        });

        it('visits all nodes with correct state with a partial visitor', () => {
            const visited = [];
            const visitor = new Visitor({
                onEnd(node, state) {
                    state.push('end');
                },
                onSummary(node, state) {
                    state.push(node.name);
                }
            });
            tree.visit(visitor, visited);
            assert.deepEqual(visited, ['root', 'g1', 'g2', 'g3', 'end']);
        });
    });

    describe('composite visitor', () => {
        it('visits multiple visitors in interleaved order with a composite', () => {
            const visited = [];
            const visitor = new Visitor({
                onStart(root, state) {
                    state.push('start');
                },
                onEnd(root, state) {
                    state.push('end');
                },
                onSummary(node, state) {
                    state.push(node.name);
                },
                onDetail(node, state) {
                    state.push(node.name);
                }
            });
            const base = [
                'start',
                'root',
                'g1',
                'g2',
                'l1',
                'l2',
                'l3',
                'l4',
                'g3',
                'l5',
                'l6',
                'l7',
                'end'
            ];
            const expected = [];
            tree.visit(new CompositeVisitor([visitor, visitor]), visited);
            base.forEach(name => {
                expected.push(name);
                expected.push(name);
            });
            assert.deepEqual(visited, expected);
        });

        it('allows use of composite with a partial visitor', () => {
            const visited = [];
            const visitor = new CompositeVisitor({
                onEnd(root, state) {
                    state.push('end');
                },
                onSummary(node, state) {
                    state.push(node.name);
                }
            });
            tree.visit(visitor, visited);
            assert.deepEqual(visited, ['root', 'g1', 'g2', 'g3', 'end']);
        });
    });
});
