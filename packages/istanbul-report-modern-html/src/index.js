// The index file for the spa running on the summary page
import * as React from 'react';
import * as ReactDOM from 'react-dom';
import SummaryTableHeader from './summaryTableHeader';
import SummaryTableLine from './summaryTableLine';
import SummaryHeader from './summaryHeader';
import getChildData from './getChildData';
import SummarizerButtons from './summarizerButtons';
import FilterButtons from './filterButtons';
import { setLocation, decodeLocation } from './routing';

const sourceData = window.data;
const metricsToShow = {};
for (let i = 0; i < window.metricsToShow.length; i++) {
    metricsToShow[window.metricsToShow[i]] = true;
}

let firstMount = true;

function App() {
    const routingDefaults = decodeLocation();

    const [activeSort, setSort] = React.useState(
        (routingDefaults && routingDefaults.activeSort) || {
            sortKey: 'file',
            order: 'desc'
        }
    );
    const [summarizerType, setSummarizerType] = React.useState(
        (routingDefaults && routingDefaults.summarizerType) || 'nested'
    );
    const [activeFilters, setFilters] = React.useState(
        (routingDefaults && routingDefaults.activeFilters) || {
            low: true,
            medium: true,
            high: true
        }
    );
    const [expandedLines, setExpandedLines] = React.useState(
        (routingDefaults && routingDefaults.expandedLines) || []
    );
    const [fileFilter, setFileFilter] = React.useState(
        (routingDefaults && routingDefaults.fileFilter) || ''
    );
    const childData = React.useMemo(
        () =>
            getChildData(
                sourceData,
                metricsToShow,
                activeSort,
                summarizerType,
                activeFilters,
                fileFilter
            ),
        [activeSort, summarizerType, activeFilters, fileFilter]
    );
    const overallMetrics = sourceData.package.metrics;

    React.useEffect(() => {
        setLocation(
            firstMount,
            activeSort,
            summarizerType,
            activeFilters,
            fileFilter,
            expandedLines
        );
        firstMount = false;
    }, [activeSort, summarizerType, activeFilters, fileFilter, expandedLines]);

    React.useEffect(() => {
        window.onpopstate = () => {
            const routingState = decodeLocation();
            if (routingState) {
                // make sure all the state is set before rendering to avoid url updates
                // alternative is to merge all the states into one so it can be set in one go
                // https://github.com/facebook/react/issues/14259
                ReactDOM.unstable_batchedUpdates(() => {
                    setFilters(routingState.activeFilters);
                    setSort(routingState.activeSort);
                    setSummarizerType(routingState.summarizerType);
                    setExpandedLines(routingState.expandedLines);
                    setFileFilter(routingState.fileFilter);
                });
            }
        };
    }, []);

    return (
        <>
            <div className="body">
                <SummaryHeader
                    metrics={overallMetrics}
                    metricsToShow={metricsToShow}
                />
                {Boolean(fileFilter) && (
                    <div className="pad1">
                        <h1>
                            {fileFilter} (
                            <a
                                href="javascript:void()"
                                onClick={() => setFileFilter('')}
                            >
                                Clear
                            </a>
                            )
                        </h1>
                    </div>
                )}
                <div className="pad1">
                    <SummarizerButtons
                        setSummarizerType={setSummarizerType}
                        summarizerType={summarizerType}
                    />
                    <FilterButtons
                        activeFilters={activeFilters}
                        setFilters={setFilters}
                    />
                </div>
                <div className="pad1">
                    <table className="coverage-summary">
                        <SummaryTableHeader
                            onSort={newSort => {
                                setSort(newSort);
                            }}
                            activeSort={activeSort}
                            metricsToShow={metricsToShow}
                        />
                        <tbody>
                            {childData.map(child => (
                                <SummaryTableLine
                                    {...child}
                                    key={child.file}
                                    metricsToShow={metricsToShow}
                                    expandedLines={expandedLines}
                                    setExpandedLines={setExpandedLines}
                                    fileFilter={fileFilter}
                                    setFileFilter={setFileFilter}
                                />
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            <div className="footer quiet pad2 space-top1 center small">
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
