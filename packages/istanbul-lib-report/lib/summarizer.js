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

        if (this.hasOwnProperty(cacheProp)) {
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

function findCommonParent(paths) {
    return paths.reduce(
        (common, path) => common.commonPrefixPath(path),
        paths[0] || new Path([])
    );
}

function toInitialList(coverageMap) {
    const list = coverageMap.files().map(filePath => ({
        filePath,
        path: new Path(filePath),
        fileCoverage: coverageMap.fileCoverageFor(filePath)
    }));

    const commonParent = findCommonParent(list.map(o => o.path.parent()));
    if (commonParent.length > 0) {
        list.forEach(o => {
            o.path.splice(0, commonParent.length);
        });
    }
    return {
        list,
        commonParent
    };
}

function findOrCreateParent(parentPath, nodeMap, created = () => {}) {
    let parent = nodeMap[parentPath.toString()];

    if (!parent) {
        parent = new ReportNode(parentPath);
        nodeMap[parentPath.toString()] = parent;
        created(parentPath, parent);
    }

    return parent;
}

function toDirParents(list) {
    const nodeMap = Object.create(null);
    list.forEach(o => {
        const parent = findOrCreateParent(o.path.parent(), nodeMap);
        parent.addChild(new ReportNode(o.path, o.fileCoverage));
    });

    return Object.keys(nodeMap).map(k => nodeMap[k]);
}

function addAllPaths(topPaths, nodeMap, path, node) {
    const parent = findOrCreateParent(
        path.parent(),
        nodeMap,
        (parentPath, parent) => {
            if (parentPath.hasParent()) {
                addAllPaths(topPaths, nodeMap, parentPath, parent);
            } else {
                topPaths.push(parent);
            }
        }
    );

    parent.addChild(node);
}

function toNested(coverageMap) {
    const nodeMap = Object.create(null);
    const topPaths = [];
    toInitialList(coverageMap).list.forEach(o => {
        const node = new ReportNode(o.path, o.fileCoverage);
        addAllPaths(topPaths, nodeMap, o.path, node);
    });
    return topPaths;
}

function foldIntoOneDir(node, parent) {
    const { children } = node;
    if (children.length === 1 && !children[0].fileCoverage) {
        children[0].parent = parent;
        return foldIntoOneDir(children[0], parent);
    }
    node.children = children.map(child => foldIntoOneDir(child, node));
    return node;
}

function createNestedSummary(coverageMap) {
    const topNodes = toNested(coverageMap).map(node => foldIntoOneDir(node));

    if (topNodes.length === 1) {
        return new ReportTree(topNodes[0]);
    }

    return new ReportTree(ReportNode.createRoot(topNodes));
}

function packageSummaryPrefix(dirParents, { commonParent }) {
    if (!dirParents.some(dp => dp.path.length === 0)) {
        return;
    }

    if (commonParent.length === 0) {
        return 'root';
    }

    return commonParent.name();
}

function createPackageSummary(coverageMap) {
    const flattened = toInitialList(coverageMap);
    const dirParents = toDirParents(flattened.list);

    if (dirParents.length === 1) {
        return new ReportTree(dirParents[0]);
    }

    return new ReportTree(
        ReportNode.createRoot(dirParents),
        packageSummaryPrefix(dirParents, flattened)
    );
}

function createFlatSummary(coverageMap) {
    const list = toInitialList(coverageMap).list.map(
        node => new ReportNode(node.path, node.fileCoverage)
    );

    return new ReportTree(ReportNode.createRoot(list));
}

module.exports = {
    createNestedSummary,
    createPackageSummary,
    createFlatSummary
};
