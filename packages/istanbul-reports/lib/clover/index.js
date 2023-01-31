'use strict';
/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
const { ReportBase } = require('istanbul-lib-report');

class CloverReport extends ReportBase {
    constructor(opts) {
        super();

        this.cw = null;
        this.xml = null;
        this.projectRoot = opts.projectRoot || process.cwd();
        this.file = opts.file || 'clover.xml';
    }

    onStart(root, context) {
        this.cw = context.writer.writeFile(this.file);
        this.xml = context.getXMLWriter(this.cw);
        this.writeRootStats(root, context);
    }

    onEnd() {
        this.xml.closeAll();
        this.cw.close();
    }

    getTreeStats(node, context) {
        const state = {
            packages: 0,
            files: 0,
            classes: 0
        };
        const visitor = {
            onSummary(node, state) {
                const metrics = node.getCoverageSummary(true);
                if (metrics) {
                    state.packages += 1;
                }
            },
            onDetail(node, state) {
                state.classes += 1;
                state.files += 1;
            }
        };
        node.visit(context.getVisitor(visitor), state);
        return state;
    }

    writeRootStats(node, context) {
        this.cw.println('<?xml version="1.0" encoding="UTF-8"?>');
        this.xml.openTag('coverage', {
            generated: Date.now().toString(),
            clover: '3.2.0'
        });

        this.xml.openTag('project', {
            timestamp: Date.now().toString(),
            name: 'All files'
        });

        const metrics = node.getCoverageSummary();
        this.xml.inlineTag('metrics', {
            statements: metrics.lines.total,
            coveredstatements: metrics.lines.covered,
            conditionals: metrics.branches.total,
            coveredconditionals: metrics.branches.covered,
            methods: metrics.functions.total,
            coveredmethods: metrics.functions.covered,
            elements:
                metrics.lines.total +
                metrics.branches.total +
                metrics.functions.total,
            coveredelements:
                metrics.lines.covered +
                metrics.branches.covered +
                metrics.functions.covered,
            complexity: 0,
            loc: metrics.lines.total,
            ncloc: metrics.lines.total, // what? copied as-is from old report
            ...this.getTreeStats(node, context)
        });
    }

    writeMetrics(metrics) {
        this.xml.inlineTag('metrics', {
            statements: metrics.lines.total,
            coveredstatements: metrics.lines.covered,
            conditionals: metrics.branches.total,
            coveredconditionals: metrics.branches.covered,
            methods: metrics.functions.total,
            coveredmethods: metrics.functions.covered
        });
    }

    onSummary(node) {
        if (node.isRoot()) {
            return;
        }
        const metrics = node.getCoverageSummary(true);
        if (!metrics) {
            return;
        }

        this.xml.openTag('package', {
            name: asJavaPackage(node)
        });
        this.writeMetrics(metrics);
    }

    onSummaryEnd(node) {
        if (node.isRoot()) {
            return;
        }
        this.xml.closeTag('package');
    }

    onDetail(node) {
        const fileCoverage = node.getFileCoverage();
        const metrics = node.getCoverageSummary();
        const branchDetails = getBranchDetails(fileCoverage);

        this.xml.openTag('file', {
            name: asClassName(node),
            path: fileCoverage.path
        });

        this.writeMetrics(metrics);

        const lines = fileCoverage.getLineCoverage();
        Object.entries(lines).forEach(([k, count]) => {
            const attrs = {
                num: k,
                count,
                type: 'stmt'
            };
            const branchDetail = branchDetails[k];

            if (!branchDetail) {
                return this.xml.inlineTag('line', attrs);
            }

            attrs.type = 'cond';
            attrs.truecount = 0;
            attrs.falsecount = 0;

            if (count === 0) {
                return this.xml.inlineTag('line', attrs);
            }

            // `if` and `cond-expr` has binary result, just apply it
            if (['if', 'cond-expr'].includes(branchDetail.type)) {
                attrs.truecount = branchDetail.states[0];
                attrs.falsecount = branchDetail.states[1];
            } else if (
                // statements of these types has no binary result
                ['switch', 'binary-expr', 'default-arg'].includes(
                    branchDetail.type
                )
            ) {
                // assigning hardcode values to make 3rd-party parsers
                // understand if condition was covered or not
                if (branchDetail.states.every(state => state > 0)) {
                    attrs.truecount = 1;
                    attrs.falsecount = 1;
                } else {
                    attrs.truecount = 1;
                    attrs.falsecount = 0;
                }
            }

            this.xml.inlineTag('line', attrs);
        });

        this.xml.closeTag('file');
    }
}

function asJavaPackage(node) {
    return node
        .getRelativeName()
        .replace(/\//g, '.')
        .replace(/\\/g, '.')
        .replace(/\.$/, '');
}

function asClassName(node) {
    return node.getRelativeName().replace(/.*[\\/]/, '');
}

function getBranchDetails(fileCoverage) {
    const branchMeta = fileCoverage.branchMap;
    const branchStats = fileCoverage.b;

    const branchDetails = {};

    Object.entries(branchMeta).forEach(([index, branch]) => {
        branchDetails[branch.loc.start.line] = {
            type: branch.type,
            states: branchStats[index]
        };
    });

    return branchDetails;
}

module.exports = CloverReport;
