import * as React from 'react';

function Ignores({ metrics, metricsToShow }) {
    const metricKeys = Object.keys(metricsToShow);
    const result = [];

    for (let i = 0; i < metricKeys.length; i++) {
        const metricKey = metricKeys[i];
        if (metricsToShow[metricKey]) {
            const skipped = metrics[metricKey].skipped;
            if (skipped > 0) {
                result.push(
                    `${skipped} ${metricKey}${
                        skipped === 1 ? '' : metricKey === 'branch' ? 'es' : 's'
                    }`
                );
            }
        }
    }

    if (result.length === 0) {
        return false;
    }

    return (
        <div className="fl pad1y">
            <span className="strong">{result.join(', ')}</span>
            <span className="quiet">Ignored</span>
        </div>
    );
}

function StatusMetric({ data, name }) {
    return (
        <div className="fl pad1y space-right2">
            <span className="strong">{data.pct}% </span>
            <span className="quiet">{name}</span>{' '}
            <span className={'fraction ' + data.classForPercent}>
                {data.covered}/{data.total}
            </span>
        </div>
    );
}

export default function SummaryHeader({ metrics, metricsToShow }) {
    return (
        <div className="pad1">
            {/* TODO - <h1>All Files</h1> - this doesn't add useful info any more. if anything it should be the name of the project - coverage*/}
            <div className="clearfix">
                {metricsToShow.statements && (
                    <StatusMetric data={metrics.statements} name="Statements" />
                )}
                {metricsToShow.branches && (
                    <StatusMetric data={metrics.branches} name="Branches" />
                )}
                {metricsToShow.functions && (
                    <StatusMetric data={metrics.functions} name="Functions" />
                )}
                {metricsToShow.lines && (
                    <StatusMetric data={metrics.lines} name="Lines" />
                )}

                <Ignores metrics={metrics} metricsToShow={metricsToShow} />
            </div>
        </div>
    );
}
