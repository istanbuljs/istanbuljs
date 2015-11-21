/* globals describe, it, beforeEach */

var assert = require('chai').assert,
    util = require('util'),
    t = require('../lib/tree'),
    BaseTree = t.Tree,
    BaseNode = t.Node,
    Visitor = t.Visitor,
    CompositeVisitor = t.CompositeVisitor;

function TestNode(name) {
    BaseNode.call(this);
    this.name = name;
    this.parent = null;
    this.children = [];
}

util.inherits(TestNode, BaseNode);

TestNode.prototype.addChild = function (child) {
    child.parent = this;
    this.children.push(child);
};

TestNode.prototype.getChildren = function () {
    return this.children;
};

TestNode.prototype.isRoot = function () {
    return this.parent === null;
};

TestNode.prototype.isSummary = function () {
    return this.children.length > 0;
};

describe('tree', function () {
    var leaves, groups, tree;

    beforeEach(function () {
        leaves = [
            new TestNode('l1'),
            new TestNode('l2'),
            new TestNode('l3'),
            new TestNode('l4'),
            new TestNode('l5'),
            new TestNode('l6'),
            new TestNode('l7'),
        ];
        groups = [
            new TestNode('g1'),
            new TestNode('g2'),
            new TestNode('g3'),
        ];
        groups[0].addChild(groups[1]);
        groups[1].addChild(leaves[0]);
        groups[1].addChild(leaves[1]);
        groups[1].addChild(leaves[2]);
        groups[0].addChild(leaves[3]);
        groups[2].addChild(leaves[4]);
        groups[2].addChild(leaves[5]);
        groups[2].addChild(leaves[6]);

        var root = new TestNode('root');
        root.addChild(groups[0]);
        root.addChild(groups[2]);
        tree = new BaseTree();
        tree.getRoot = function () {
            return root;
        };
    });

    describe('single visitor', function () {
        it('visits all nodes with correct state with a full visitor', function () {
            var visited = [],
                visitor = new Visitor({
                    onStart: function (node, state) { state.push('start'); },
                    onEnd: function (node, state) { state.push('end'); },
                    onSummary: function (node, state) { state.push(node.name); },
                    onDetail: function (node, state) { state.push(node.name); }
                });
            tree.visit(visitor, visited);
            assert.deepEqual(visited, ['start', 'root', 'g1', 'g2', 'l1', 'l2', 'l3', 'l4', 'g3', 'l5', 'l6', 'l7', 'end']);
        });

        it('visits all nodes with correct state with a partial visitor', function () {
            var visited = [],
                visitor = new Visitor({
                    onEnd: function (node, state) { state.push('end'); },
                    onSummary: function (node, state) { state.push(node.name); },
                });
            tree.visit(visitor, visited);
            assert.deepEqual(visited, ['root', 'g1', 'g2', 'g3', 'end']);
        });
    });

    describe('composite visitor', function () {
        it('visits multiple visitors in interleaved order with a composite', function () {
            var visited = [],
                visitor = new Visitor({
                    onStart: function (root, state) { state.push('start'); },
                    onEnd: function (root, state) { state.push('end'); },
                    onSummary: function (node, state) { state.push(node.name); },
                    onDetail: function (node, state) { state.push(node.name); }
                }),
                base = ['start', 'root', 'g1', 'g2', 'l1', 'l2', 'l3', 'l4', 'g3', 'l5', 'l6', 'l7', 'end'],
                expected = [];
            tree.visit(new CompositeVisitor([visitor, visitor]), visited);
            base.forEach(function (name) { expected.push(name); expected.push(name); });
            assert.deepEqual(visited, expected);
        });

        it('allows use of composite with a partial visitor', function () {
            var visited = [],
                visitor = new CompositeVisitor({
                    onEnd: function (root, state) { state.push('end'); },
                    onSummary: function (node, state) { state.push(node.name); },
                });
            tree.visit(visitor, visited);
            assert.deepEqual(visited, ['root', 'g1', 'g2', 'g3', 'end']);
        });
    });
});
