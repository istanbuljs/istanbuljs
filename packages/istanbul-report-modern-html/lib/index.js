/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
const fs = require('fs');
const path = require('path');
const HtmlReport = require('istanbul-reports/lib/html');

const standardLinkMapper = {
    getPath(node) {
        if (typeof node === 'string') {
            return node;
        }
        let filePath = node.getQualifiedName();
        if (node.isSummary()) {
            if (filePath !== '') {
                filePath += '/index.html';
            } else {
                filePath = 'index.html';
            }
        } else {
            filePath += '.html';
        }
        return filePath;
    },

    relativePath(source, target) {
        const targetPath = this.getPath(target);
        const sourcePath = path.dirname(this.getPath(source));
        return path.relative(sourcePath, targetPath);
    },

    assetPath(node, name) {
        return this.relativePath(this.getPath(node), name);
    }
};

function ModernHtmlReport(opts) {
    this.verbose = opts.verbose;
    this.linkMapper = opts.linkMapper || standardLinkMapper;
    this.subdir = opts.subdir || '';
    this.date = Date();
    this.skipEmpty = opts.skipEmpty;
    this.htmlReport = new HtmlReport(opts);
}

ModernHtmlReport.prototype.getWriter = function(context) {
    if (!this.subdir) {
        return context.writer;
    }
    return context.writer.writerForDir(this.subdir);
};

ModernHtmlReport.prototype.onStart = function(root, context) {
    this.htmlReport.onStart(root, context);

    const writer = this.getWriter(context);
    const srcDir = path.resolve(__dirname, '../assets');
    fs.readdirSync(srcDir).forEach(f => {
        const resolvedSource = path.resolve(srcDir, f);
        const resolvedDestination = '.';
        const stat = fs.statSync(resolvedSource);
        let dest;

        if (stat.isFile()) {
            dest = resolvedDestination + '/' + f;
            if (this.verbose) {
                console.log('Write asset: ' + dest);
            }
            writer.copyFile(resolvedSource, dest);
        }
    });
};

ModernHtmlReport.prototype.onDetail = function(node, context) {
    this.htmlReport.onDetail(node, context);
};

ModernHtmlReport.prototype.getMetric = function(metric, type, context) {
    return {
        total: metric.total,
        covered: metric.covered,
        skipped: metric.skipped,
        pct: metric.pct,
        classForPercent: context.classForPercent(type, metric.pct)
    };
};

ModernHtmlReport.prototype.toDataStructure = function(node, parent, context) {
    const coverageSummary = node.getCoverageSummary();
    const metrics = {
        statements: this.getMetric(
            coverageSummary.statements,
            'statements',
            context
        ),
        branches: this.getMetric(coverageSummary.branches, 'branches', context),
        functions: this.getMetric(
            coverageSummary.functions,
            'functions',
            context
        ),
        lines: this.getMetric(coverageSummary.lines, 'lines', context)
    };

    return {
        file: node.getRelativeName(),
        output: parent && this.linkMapper.relativePath(parent, node),
        isEmpty: coverageSummary.isEmpty(),
        metrics,
        children:
            node.isSummary() &&
            node
                .getChildren()
                .map(child => this.toDataStructure(child, node, context))
    };
};

ModernHtmlReport.prototype.writeSummary = function(
    nestedRootNode,
    packageRootNode,
    context
) {
    const data = {
        package: this.toDataStructure(packageRootNode, null, context),
        nested: this.toDataStructure(nestedRootNode, null, context)
    };

    const cw = this.getWriter(context).writeFile(
        this.linkMapper.getPath(packageRootNode)
    );
    cw.write(
        `<!doctype html>
        <html lang="en">
            <head>
                <link rel="stylesheet" href="modern.css" />
                <meta name="viewport" content="width=device-width, initial-scale=1">
            </head>
            <body>
                <div id="app"></div>
                <script>
                    window.data=${JSON.stringify(data)};
                    window.generatedDatetime = ${JSON.stringify(
                        String(Date())
                    )};
                </script>
                <script src="bundle.js"></script>
            </body>
        </html>`
    );
    cw.close();
};

module.exports = ModernHtmlReport;
