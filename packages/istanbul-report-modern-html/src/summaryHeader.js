import * as React from 'react';

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
            <span className="strong">
                <span className="ignore-none">none</span>
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
            <span className="strong">{result.join(', ')}</span>
            <span className="quiet">Ignored</span>
        </>
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

export default function SummaryHeader({ metrics }) {
    return (
        <div className="pad1">
            {/* TODO - <h1>All Files</h1> - this doesn't add useful info any more. if anything it should be the name of the project - coverage*/}
            <div className="clearfix">
                <StatusMetric data={metrics.statements} name="Statements" />
                <StatusMetric data={metrics.branches} name="Branches" />
                <StatusMetric data={metrics.functions} name="Functions" />
                <StatusMetric data={metrics.lines} name="Lines" />
                {ifHasIgnores(metrics) && (
                    <div className="fl pad1y">
                        <Ignores metrics={metrics} />
                    </div>
                )}
            </div>
        </div>
    );
}
