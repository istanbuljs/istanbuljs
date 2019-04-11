// The index file for the spa running on the summary page
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import SummaryTableHeader from './summaryTableHeader';
import SummaryTableLine from './summaryTableLine';
import SummaryHeader from './summaryHeader';

const sourceData = window.data;

function addPath(node, parentPath) {
    if (!parentPath) {
        return node;
    }
    return { ...node, file: parentPath + '/' + node.file };
}

function flatten(nodes, parentPath) {
    let children = [];
    for (var i = 0; i < nodes.length; i++) {
        let child = nodes[i];
        if (child.children) {
            children = [
                ...children.map(child => addPath(child, parentPath)),
                ...flatten(
                    child.children,
                    (!parentPath ? '' : '/' + parentPath) + child.file
                )
            ];
        } else {
            children.push(addPath(child, parentPath));
        }
    }
    return children;
}

function sort(childData, activeSort) {
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
            const [metricType, valueType] = activeSort.sortKey.split('.');
            valueA = a.metrics[metricType][valueType];
            valueB = b.metrics[metricType][valueType];
        }

        if (valueA === valueB) {
            return 0;
        }
        return valueA < valueB ? top : bottom;
    });

    for (let i = 0; i < childData.length; i++) {
        let child = childData[i];
        if (child.children) {
            childData[i] = {
                ...child,
                children: sort(child.children, activeSort)
            };
        }
    }
    return childData;
}

function filter(nodes, activeFilters) {
    let children = [];
    for (var i = 0; i < nodes.length; i++) {
        let child = nodes[i];
        if (child.children) {
            const newSubChildren = filter(child.children, activeFilters);
            if (newSubChildren.length) {
                child = { ...child, children: newSubChildren };
                children.push(child);
            }
        } else {
            if (
                activeFilters[child.metrics.statements.classForPercent] ||
                activeFilters[child.metrics.branches.classForPercent] ||
                activeFilters[child.metrics.functions.classForPercent] ||
                activeFilters[child.metrics.lines.classForPercent]
            ) {
                children.push(child);
            }
        }
    }
    return children;
}

function getChildData(activeSort, summarizerType, activeFilters) {
    let childData;

    if (summarizerType === 'flat') {
        childData = flatten(sourceData['package'].children.slice(0));
    } else {
        childData = sourceData[summarizerType].children;
    }

    childData = filter(childData, activeFilters);

    if (activeSort) {
        childData = sort(childData, activeSort);
    }
    return childData;
}

function SummarizerButton({
    summarizerType,
    activeSummarizerType,
    setSummarizerType,
    children
}) {
    return (
        <button
            onClick={() => setSummarizerType(summarizerType)}
            class={
                'togglebutton ' +
                (summarizerType === activeSummarizerType ? 'enabled' : '')
            }
        >
            {children}
        </button>
    );
}

function FilterButton({ children, filter, activeFilters, setFilters }) {
    return (
        <button
            class={'togglebutton ' + (activeFilters[filter] ? 'enabled' : '')}
            onClick={() =>
                setFilters({
                    ...activeFilters,
                    [filter]: !activeFilters[filter]
                })
            }
        >
            {children}
        </button>
    );
}

function App() {
    const [activeSort, setSort] = React.useState({
        sortKey: 'file',
        order: 'asc'
    });
    const [summarizerType, setSummarizerType] = React.useState('package');
    const [activeFilters, setFilters] = React.useState({
        low: true,
        medium: true,
        high: true
    });
    const childData = React.useMemo(
        () => getChildData(activeSort, summarizerType, activeFilters),
        [activeSort, summarizerType, activeFilters]
    );
    const overallMetrics = sourceData.package.metrics;

    return (
        <>
            <div class="wrapper">
                <SummaryHeader metrics={overallMetrics} />
                <div class="pad1">
                    <div class="buttongroup">
                        <label>Summarizer:</label>
                        <SummarizerButton
                            setSummarizerType={setSummarizerType}
                            summarizerType="package"
                            activeSummarizerType={summarizerType}
                        >
                            Package
                        </SummarizerButton>
                        <SummarizerButton
                            setSummarizerType={setSummarizerType}
                            summarizerType="nested"
                            activeSummarizerType={summarizerType}
                        >
                            Nested
                        </SummarizerButton>
                        <SummarizerButton
                            setSummarizerType={setSummarizerType}
                            summarizerType="flat"
                            activeSummarizerType={summarizerType}
                        >
                            Flat
                        </SummarizerButton>
                    </div>
                    <div class="buttongroup">
                        <label>Coverage:</label>
                        <FilterButton
                            filter="low"
                            activeFilters={activeFilters}
                            setFilters={setFilters}
                        >
                            Low
                        </FilterButton>
                        <FilterButton
                            filter="medium"
                            activeFilters={activeFilters}
                            setFilters={setFilters}
                        >
                            Medium
                        </FilterButton>
                        <FilterButton
                            filter="high"
                            activeFilters={activeFilters}
                            setFilters={setFilters}
                        >
                            High
                        </FilterButton>
                    </div>
                </div>
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
                                <SummaryTableLine {...child} key={child.file} />
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
