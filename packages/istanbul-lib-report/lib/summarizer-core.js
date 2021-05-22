/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

const coverage = require('istanbul-lib-coverage');
const Path = require('./path');
const { BaseNode, BaseTree } = require('./tree');

class ReportNode extends BaseNode {
    constructor(path, fileCoverage) {
        super();

        this.path = path;
        this.parent = null;
        this.fileCoverage = fileCoverage;
        this.children = [];
    }

    static createRoot(children) {
        const root = new ReportNode(new Path([]));

        children.forEach(child => {
            root.addChild(child);
        });

        return root;
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }

    asRelative(p) {
        if (p.substring(0, 1) === '/') {
            return p.substring(1);
        }
        return p;
    }

    getQualifiedName() {
        return this.asRelative(this.path.toString());
    }

    getRelativeName() {
        const parent = this.getParent();
        const myPath = this.path;
        let relPath;
        let i;
        const parentPath = parent ? parent.path : new Path([]);
        if (parentPath.ancestorOf(myPath)) {
            relPath = new Path(myPath.elements());
            for (i = 0; i < parentPath.length; i += 1) {
                relPath.shift();
            }
            return this.asRelative(relPath.toString());
        }
        return this.asRelative(this.path.toString());
    }

    getParent() {
        return this.parent;
    }

    getChildren() {
        return this.children;
    }

    isSummary() {
        return !this.fileCoverage;
    }

    getFileCoverage() {
        return this.fileCoverage;
    }

    getCoverageSummary(filesOnly) {
        const cacheProp = `c_${filesOnly ? 'files' : 'full'}`;
        let summary;

        if (Object.prototype.hasOwnProperty.call(this, cacheProp)) {
            return this[cacheProp];
        }

        if (!this.isSummary()) {
            summary = this.getFileCoverage().toSummary();
        } else {
            let count = 0;
            summary = coverage.createCoverageSummary();
            this.getChildren().forEach(child => {
                if (filesOnly && child.isSummary()) {
                    return;
                }
                count += 1;
                summary.merge(child.getCoverageSummary(filesOnly));
            });
            if (count === 0 && filesOnly) {
                summary = null;
            }
        }
        this[cacheProp] = summary;
        return summary;
    }
}

class ReportTree extends BaseTree {
    constructor(root, childPrefix) {
        super(root);

        const maybePrefix = node => {
            if (childPrefix && !node.isRoot()) {
                node.path.unshift(childPrefix);
            }
        };
        this.visit({
            onDetail: maybePrefix,
            onSummary(node) {
                maybePrefix(node);
                node.children.sort((a, b) => {
                    const astr = a.path.toString();
                    const bstr = b.path.toString();
                    return astr < bstr
                        ? -1
                        : astr > bstr
                        ? 1
                        : /* istanbul ignore next */ 0;
                });
            }
        });
    }
}

const Util = {
    addAllPaths(topPaths, nodeMap, path, node) {
        const parent = Util.findOrCreateParent(
            path.parent(),
            nodeMap,
            (parentPath, parent) => {
                if (parentPath.hasParent()) {
                    Util.addAllPaths(topPaths, nodeMap, parentPath, parent);
                } else {
                    topPaths.push(parent);
                }
            }
        );

        parent.addChild(node);
    },

    findCommonParent(paths) {
        return paths.reduce(
            (common, path) => common.commonPrefixPath(path),
            paths[0] || new Path([])
        );
    },

    findOrCreateParent(parentPath, nodeMap, created = () => {}) {
        let parent = nodeMap[parentPath.toString()];

        if (!parent) {
            parent = new ReportNode(parentPath);
            nodeMap[parentPath.toString()] = parent;
            created(parentPath, parent);
        }

        return parent;
    },

    foldIntoOneDir(node, parent) {
        const { children } = node;
        if (children.length === 1 && !children[0].fileCoverage) {
            children[0].parent = parent;
            return Util.foldIntoOneDir(children[0], parent);
        }
        node.children = children.map(child => Util.foldIntoOneDir(child, node));
        return node;
    },

    toDirParents(list) {
        const nodeMap = Object.create(null);
        list.forEach(o => {
            const parent = Util.findOrCreateParent(o.path.parent(), nodeMap);
            parent.addChild(new ReportNode(o.path, o.fileCoverage));
        });

        return Object.values(nodeMap);
    },

    pkgSummaryPrefix(dirParents, commonParent) {
        if (!dirParents.some(dp => dp.path.length === 0)) {
            return;
        }

        if (commonParent.length === 0) {
            return 'root';
        }

        return commonParent.name();
    }
};

/**
 * Return a "flat" report tree. This tree contains all source files as direct children of
 * of the root node, with no intermediate nodes.
 */
function getFlatTree(initialList /*, commonParent */) {
    return new ReportTree(
        ReportNode.createRoot(
            initialList.map(
                node => new ReportNode(node.path, node.fileCoverage)
            )
        )
    );
}

/**
 * Return a "package" report tree. This tree creates intermediate nodes for all directories
 * that contain at least one source file, but skips (collapses) intermediate directories
 * that only contain other directories.
 */
function getPkgTree(initialList, commonParent) {
    const dirParents = Util.toDirParents(initialList);
    if (dirParents.length === 1) {
        return new ReportTree(dirParents[0]);
    }

    return new ReportTree(
        ReportNode.createRoot(dirParents),
        Util.pkgSummaryPrefix(dirParents, commonParent)
    );
}

/**
 * Return a "nested" report tree. This tree creates intermediate nodes for every subdirectory,
 * similar to a standard file explorer.
 */
function getNestedTree(initialList /*, commonParent */) {
    const nodeMap = Object.create(null);
    const topPaths = [];
    initialList.forEach(o => {
        const node = new ReportNode(o.path, o.fileCoverage);
        Util.addAllPaths(topPaths, nodeMap, o.path, node);
    });

    const topNodes = topPaths.map(node => Util.foldIntoOneDir(node));
    if (topNodes.length === 1) {
        return new ReportTree(topNodes[0]);
    }

    return new ReportTree(ReportNode.createRoot(topNodes));
}

module.exports = {
    ReportNode,
    ReportTree,
    Util,
    getFlatTree,
    getPkgTree,
    getNestedTree
};
