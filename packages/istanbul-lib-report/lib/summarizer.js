/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

const coverage = require('istanbul-lib-coverage');
const Path = require('./path');
const tree = require('./tree');
const BaseNode = tree.Node;
const BaseTree = tree.Tree;

class ReportNode extends BaseNode {
    constructor(path, fileCoverage) {
        super();

        this.path = path;
        this.parent = null;
        this.fileCoverage = fileCoverage;
        this.children = [];
    }

    addChild(child) {
        child.parent = this;
        this.children.push(child);
    }

    asRelative(p) {
        /* istanbul ignore if */
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
        const cacheProp = 'c_' + (filesOnly ? 'files' : 'full');
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

function treeFor(root, childPrefix) {
    const tree = new BaseTree();
    const maybePrefix = function(node) {
        if (childPrefix && !node.isRoot()) {
            node.path.unshift(childPrefix);
        }
    };
    tree.getRoot = function() {
        return root;
    };
    const visitor = {
        onDetail(node) {
            maybePrefix(node);
        },
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
    };
    tree.visit(visitor);
    return tree;
}

function findCommonParent(paths) {
    if (paths.length === 0) {
        return new Path([]);
    }
    let common = paths[0];
    let i;

    for (i = 1; i < paths.length; i += 1) {
        common = common.commonPrefixPath(paths[i]);
        if (common.length === 0) {
            break;
        }
    }
    return common;
}

function toInitialList(coverageMap) {
    const ret = [];
    coverageMap.files().forEach(filePath => {
        const p = new Path(filePath);
        const coverage = coverageMap.fileCoverageFor(filePath);
        ret.push({
            filePath,
            path: p,
            fileCoverage: coverage
        });
    });

    const commonParent = findCommonParent(ret.map(o => o.path.parent()));
    if (commonParent.length > 0) {
        ret.forEach(o => {
            o.path.splice(0, commonParent.length);
        });
    }
    return {
        list: ret,
        commonParent
    };
}

function toDirParents(list) {
    const nodeMap = Object.create(null);
    const parentNodeList = [];
    list.forEach(o => {
        const node = new ReportNode(o.path, o.fileCoverage);
        const parentPath = o.path.parent();
        let parent = nodeMap[parentPath.toString()];

        if (!parent) {
            parent = new ReportNode(parentPath);
            nodeMap[parentPath.toString()] = parent;
            parentNodeList.push(parent);
        }
        parent.addChild(node);
    });
    return parentNodeList;
}

function addAllPaths(topPaths, nodeMap, path, node) {
    const parentPath = path.parent();
    let parent = nodeMap[parentPath.toString()];

    if (!parent) {
        parent = new ReportNode(parentPath);
        nodeMap[parentPath.toString()] = parent;

        if (parentPath.hasParent()) {
            addAllPaths(topPaths, nodeMap, parentPath, parent);
        } else {
            topPaths.push(parent);
        }
    }
    parent.addChild(node);
}

function toNested(list) {
    const nodeMap = Object.create(null);
    const topNodes = [];
    list.forEach(o => {
        const node = new ReportNode(o.path, o.fileCoverage);

        addAllPaths(topNodes, nodeMap, o.path, node);
    });
    return topNodes;
}

function foldIntoOneDir(node, parent) {
    const children = node.children;
    if (children.length === 1 && !children[0].fileCoverage) {
        children[0].parent = parent;
        return foldIntoOneDir(children[0], parent);
    }
    for (let i = 0; i < children.length; i++) {
        children[i] = foldIntoOneDir(children[i], node);
    }
    return node;
}

function foldInOneDirNodes(list) {
    return list.map(node => foldIntoOneDir(node));
}

function createRoot() {
    return new ReportNode(new Path([]));
}

function createNestedSummary(coverageMap) {
    const flattened = toInitialList(coverageMap);
    const topNodes = foldInOneDirNodes(toNested(flattened.list));

    if (topNodes.length === 0) {
        return treeFor(new ReportNode(new Path([])));
    }

    if (topNodes.length === 1) {
        return treeFor(topNodes[0]);
    }

    const root = createRoot();
    topNodes.forEach(node => {
        root.addChild(node);
    });
    return treeFor(root);
}

function createPackageSummary(coverageMap) {
    const flattened = toInitialList(coverageMap);
    const dirParents = toDirParents(flattened.list);
    const common = flattened.commonParent;
    let prefix;
    let root;

    if (dirParents.length === 1) {
        root = dirParents[0];
    } else {
        root = createRoot();
        // if one of the dirs is itself the root,
        // then we need to create a top-level dir
        dirParents.forEach(dp => {
            if (dp.path.length === 0) {
                prefix = 'root';
            }
        });
        if (prefix && common.length > 0) {
            prefix = common.elements()[common.elements().length - 1];
        }
        dirParents.forEach(node => {
            root.addChild(node);
        });
    }
    return treeFor(root, prefix);
}

function createFlatSummary(coverageMap) {
    const flattened = toInitialList(coverageMap);
    const list = flattened.list;
    const root = createRoot();

    list.forEach(o => {
        const node = new ReportNode(o.path, o.fileCoverage);
        root.addChild(node);
    });
    return treeFor(root);
}

module.exports = {
    createNestedSummary,
    createPackageSummary,
    createFlatSummary
};
