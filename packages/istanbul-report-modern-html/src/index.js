// The index file for the spa running on the summary page
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import SummaryTableHeader from './summaryTableHeader';
import SummaryTableLine from './summaryTableLine';

const sourceData = window.data;

function StatusMetric({ data, name }) {
    return (
        <div class="fl pad1y space-right2">
            <span class="strong">{data.pct}% </span>
            <span class="quiet">{name}</span>{' '}
            <span class="fraction">
                {data.covered}/{data.total}
            </span>
        </div>
    );
}

function ifHasIgnores(metrics) {
    return (
        metrics.statements.skipped +
            metrics.functions.skipped +
            metrics.branches.skipped >
        0
    );
}

function Ignores({ metrics }) {
    const statements = metrics.statements.skipped;
    const functions = metrics.functions.skipped;
    const branches = metrics.branches.skipped;

    if (statements === 0 && functions === 0 && branches === 0) {
        return (
            <span class="strong">
                <span class="ignore-none">none</span>
            </span>
        );
    }

    const result = [];
    if (statements > 0) {
        result.push(
            statements === 1 ? '1 statement' : statements + ' statements'
        );
    }
    if (functions > 0) {
        result.push(functions === 1 ? '1 function' : functions + ' functions');
    }
    if (branches > 0) {
        result.push(branches === 1 ? '1 branch' : branches + ' branches');
    }

    return (
        <>
            <span class="strong">{result.join(', ')}</span>
            <span class="quiet">Ignored</span>
        </>
    );
}

function flatten(node) {
    if (node.children) {
        let children = [];
        for (var i = 0; i < node.children.length; i++) {
            children = [...children, ...flatten(node.children[i])];
        }
        return children;
    } else {
        return [node];
    }
}

function getChildData(activeSort, treeType) {
    let childData = sourceData.children.slice(0);

    if (treeType === 'flat') {
        childData = flatten({ children: childData });
    }

    if (activeSort) {
        const top = activeSort.order === 'asc' ? 1 : -1;
        const bottom = activeSort.order === 'asc' ? -1 : 1;
        childData.sort((a, b) => {
            let valueA;
            let valueB;
            if (activeSort.sortKey === 'file') {
                // reverse to match original report ordering
                valueB = a.file;
                valueA = b.file;
            } else {
                valueA = a.metrics[activeSort.sortKey].pct;
                valueB = b.metrics[activeSort.sortKey].pct;
            }

            if (valueA === valueB) {
                return 0;
            }
            return valueA < valueB ? top : bottom;
        });
    }
    return childData;
}

function App() {
    const [activeSort, setSort] = React.useState({
        sortKey: 'file',
        order: 'asc'
    });
    const [treeType, setTreeType] = React.useState('flat');
    const childData = React.useMemo(() => getChildData(activeSort, treeType), [
        activeSort,
        treeType
    ]);

    return (
        <>
            <div class="wrapper">
                <div class="pad1">
                    {/* TODO - <h1>All Files</h1> - this doesn't add useful info any more. if anything it should be the name of the project - coverage*/}
                    <div class="clearfix">
                        <StatusMetric
                            data={sourceData.metrics.statements}
                            name="Statements"
                        />
                        <StatusMetric
                            data={sourceData.metrics.branches}
                            name="Branches"
                        />
                        <StatusMetric
                            data={sourceData.metrics.functions}
                            name="Functions"
                        />
                        <StatusMetric
                            data={sourceData.metrics.lines}
                            name="Lines"
                        />
                        {ifHasIgnores(sourceData.metrics) && (
                            <div class="fl pad1y">
                                <Ignores metrics={sourceData.metrics} />
                            </div>
                        )}
                    </div>
                </div>
                <div
                    class={
                        'status-line ' +
                        sourceData.metrics.statements.classForPercent
                    }
                />
                <div class="pad1">
                    <table class="coverage-summary">
                        <SummaryTableHeader
                            onSort={newSort => {
                                setSort(newSort);
                            }}
                            activeSort={activeSort}
                        />
                        <tbody>
                            {childData.map(child => (
                                <SummaryTableLine {...child} />
                            ))}
                        </tbody>
                    </table>
                </div>
                <div class="push" />
                {/* for sticky footer */}
            </div>
            <div class="footer quiet pad2 space-top1 center small">
                Code coverage generated by{' '}
                <a href="https://istanbul.js.org/" target="_blank">
                    istanbul
                </a>{' '}
                at {window.generatedDatetime}
            </div>
        </>
    );
}

ReactDOM.render(<App />, document.getElementById('app'));
