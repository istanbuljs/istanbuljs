/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

var InsertionText = require('./insertion-text');
var lt = '\u0001';
var gt = '\u0002';
var RE_LT = /</g;
var RE_GT = />/g;
var RE_AMP = /&/g;
// eslint-disable-next-line
var RE_lt = /\u0001/g;
// eslint-disable-next-line
var RE_gt = /\u0002/g;

function title(str) {
    return ' title="' + str + '" ';
}

function customEscape(text) {
    text = String(text);
    return text
        .replace(RE_AMP, '&amp;')
        .replace(RE_LT, '&lt;')
        .replace(RE_GT, '&gt;')
        .replace(RE_lt, '<')
        .replace(RE_gt, '>');
}

function annotateLines(fileCoverage, structuredText) {
    var lineStats = fileCoverage.getLineCoverage();
    if (!lineStats) {
        return;
    }
    Object.keys(lineStats).forEach(lineNumber => {
        var count = lineStats[lineNumber];
        if (structuredText[lineNumber]) {
            structuredText[lineNumber].covered = count > 0 ? 'yes' : 'no';
            structuredText[lineNumber].hits = count;
        }
    });
}

function annotateStatements(fileCoverage, structuredText) {
    var statementStats = fileCoverage.s;
    var statementMeta = fileCoverage.statementMap;
    Object.keys(statementStats).forEach(stName => {
        var count = statementStats[stName];
        var meta = statementMeta[stName];
        var type = count > 0 ? 'yes' : 'no';
        var startCol = meta.start.column;
        var endCol = meta.end.column + 1;
        var startLine = meta.start.line;
        var endLine = meta.end.line;
        var openSpan =
            lt +
            'span class="' +
            (meta.skip ? 'cstat-skip' : 'cstat-no') +
            '"' +
            title('statement not covered') +
            gt;
        var closeSpan = lt + '/span' + gt;
        var text;

        if (type === 'no' && structuredText[startLine]) {
            if (endLine !== startLine) {
                endCol = structuredText[startLine].text.originalLength();
            }
            text = structuredText[startLine].text;
            text.wrap(
                startCol,
                openSpan,
                startCol < endCol ? endCol : text.originalLength(),
                closeSpan
            );
        }
    });
}

function annotateFunctions(fileCoverage, structuredText) {
    var fnStats = fileCoverage.f;
    var fnMeta = fileCoverage.fnMap;
    if (!fnStats) {
        return;
    }
    Object.keys(fnStats).forEach(fName => {
        var count = fnStats[fName];
        var meta = fnMeta[fName];
        var type = count > 0 ? 'yes' : 'no';
        var startCol = meta.decl.start.column;
        var endCol = meta.decl.end.column + 1;
        var startLine = meta.decl.start.line;
        var endLine = meta.decl.end.line;
        var openSpan =
            lt +
            'span class="' +
            (meta.skip ? 'fstat-skip' : 'fstat-no') +
            '"' +
            title('function not covered') +
            gt;
        var closeSpan = lt + '/span' + gt;
        var text;

        if (type === 'no' && structuredText[startLine]) {
            if (endLine !== startLine) {
                endCol = structuredText[startLine].text.originalLength();
            }
            text = structuredText[startLine].text;
            text.wrap(
                startCol,
                openSpan,
                startCol < endCol ? endCol : text.originalLength(),
                closeSpan
            );
        }
    });
}

function annotateBranches(fileCoverage, structuredText) {
    var branchStats = fileCoverage.b;
    var branchMeta = fileCoverage.branchMap;
    if (!branchStats) {
        return;
    }

    Object.keys(branchStats).forEach(branchName => {
        var branchArray = branchStats[branchName];
        var sumCount = branchArray.reduce((p, n) => p + n, 0);
        var metaArray = branchMeta[branchName].locations;
        var i;
        var count;
        var meta;
        var startCol;
        var endCol;
        var startLine;
        var endLine;
        var openSpan;
        var closeSpan;
        var text;

        // only highlight if partial branches are missing or if there is a
        // single uncovered branch.
        if (sumCount > 0 || (sumCount === 0 && branchArray.length === 1)) {
            for (
                i = 0;
                i < branchArray.length && i < metaArray.length;
                i += 1
            ) {
                count = branchArray[i];
                meta = metaArray[i];
                startCol = meta.start.column;
                endCol = meta.end.column + 1;
                startLine = meta.start.line;
                endLine = meta.end.line;
                openSpan =
                    lt +
                    'span class="branch-' +
                    i +
                    ' ' +
                    (meta.skip ? 'cbranch-skip' : 'cbranch-no') +
                    '"' +
                    title('branch not covered') +
                    gt;
                closeSpan = lt + '/span' + gt;

                if (count === 0 && structuredText[startLine]) {
                    //skip branches taken
                    if (endLine !== startLine) {
                        endCol = structuredText[
                            startLine
                        ].text.originalLength();
                    }
                    text = structuredText[startLine].text;
                    if (branchMeta[branchName].type === 'if') {
                        // 'if' is a special case
                        // since the else branch might not be visible, being non-existent
                        text.insertAt(
                            startCol,
                            lt +
                                'span class="' +
                                (meta.skip
                                    ? 'skip-if-branch'
                                    : 'missing-if-branch') +
                                '"' +
                                title(
                                    (i === 0 ? 'if' : 'else') +
                                        ' path not taken'
                                ) +
                                gt +
                                (i === 0 ? 'I' : 'E') +
                                lt +
                                '/span' +
                                gt,
                            true,
                            false
                        );
                    } else {
                        text.wrap(
                            startCol,
                            openSpan,
                            startCol < endCol ? endCol : text.originalLength(),
                            closeSpan
                        );
                    }
                }
            }
        }
    });
}

function annotateSourceCode(fileCoverage, sourceStore) {
    var codeArray;
    var lineCoverageArray;
    try {
        var sourceText = sourceStore.getSource(fileCoverage.path);
        var code = sourceText.split(/(?:\r?\n)|\r/);
        var count = 0;
        var structured = code.map(str => {
            count += 1;
            return {
                line: count,
                covered: 'neutral',
                hits: 0,
                text: new InsertionText(str, true)
            };
        });
        structured.unshift({
            line: 0,
            covered: null,
            text: new InsertionText('')
        });
        annotateLines(fileCoverage, structured);
        //note: order is important, since statements typically result in spanning the whole line and doing branches late
        //causes mismatched tags
        annotateBranches(fileCoverage, structured);
        annotateFunctions(fileCoverage, structured);
        annotateStatements(fileCoverage, structured);
        structured.shift();

        codeArray = structured.map(
            item => customEscape(item.text.toString()) || '&nbsp;'
        );

        lineCoverageArray = structured.map(item => ({
            covered: item.covered,
            hits: item.hits > 0 ? item.hits + 'x' : '&nbsp;'
        }));

        return {
            annotatedCode: codeArray,
            lineCoverage: lineCoverageArray,
            maxLines: structured.length
        };
    } catch (ex) {
        codeArray = [ex.message];
        lineCoverageArray = [{ covered: 'no', hits: 0 }];
        String(ex.stack || '')
            .split(/\r?\n/)
            .forEach(line => {
                codeArray.push(line);
                lineCoverageArray.push({ covered: 'no', hits: 0 });
            });
        return {
            annotatedCode: codeArray,
            lineCoverage: lineCoverageArray,
            maxLines: codeArray.length
        };
    }
}

module.exports = {
    annotateSourceCode
};
