import * as React from 'react';

function ShowPicture({ num }) {
    let rest;
    let cls = '';
    if (isFinite(num)) {
        if (num === 100) {
            cls = ' cover-full';
        }
        num = Math.floor(num);
        rest = 100 - num;
        return (
            <>
                <div
                    className={'cover-fill' + cls}
                    style={{ width: num + '%' }}
                />
                <div className="cover-empty" style={{ width: rest + '%' }} />
            </>
        );
    } else {
        return false;
    }
}

function MetricCells({ metrics }) {
    return (
        <>
            <td className={'pct ' + metrics.classForPercent}>{metrics.pct}%</td>
            <td className={'abs ' + metrics.classForPercent}>
                {metrics.covered}
            </td>
            <td className={'abs ' + metrics.classForPercent}>
                {metrics.total}
            </td>
        </>
    );
}

export default function SummaryTableLine({
    prefix,
    metrics,
    file,
    children,
    tabSize
}) {
    const [toggled, setToggled] = React.useState(false);
    tabSize = tabSize || 0;
    if (children && tabSize > 0) {
        tabSize--;
    }
    prefix = prefix || '';

    return (
        <>
            <tr>
                <td
                    className={'file ' + metrics.statements.classForPercent}
                    rowSpan={2}
                >
                    {/* eslint-disable-line prefer-spread */ Array.apply(null, {
                        length: tabSize
                    }).map((nothing, index) => (
                        <span className="filetab" key={index} />
                    ))}
                    {children ? (
                        <>
                            <a
                                onClick={() => setToggled(!toggled)}
                                className="expandbutton"
                            >
                                {toggled ? String.fromCharCode(0x2013) : '+'}
                            </a>
                            <a onClick={() => setToggled(!toggled)}>{file}</a>
                        </>
                    ) : (
                        <a href={`./${prefix}${file}.html`}>{file}</a>
                    )}
                </td>
                <MetricCells metrics={metrics.statements} />
                <MetricCells metrics={metrics.branches} />
                <MetricCells metrics={metrics.functions} />
                <MetricCells metrics={metrics.lines} />
            </tr>
            <tr>
                <td
                    className={'pic ' + metrics.statements.classForPercent}
                    colSpan={3}
                >
                    <div className="chart">
                        <ShowPicture num={metrics.statements.pct} />
                    </div>
                </td>
                <td
                    className={'pic ' + metrics.branches.classForPercent}
                    colSpan={3}
                >
                    <div className="chart">
                        <ShowPicture num={metrics.branches.pct} />
                    </div>
                </td>
                <td
                    className={'pic ' + metrics.functions.classForPercent}
                    colSpan={3}
                >
                    <div className="chart">
                        <ShowPicture num={metrics.functions.pct} />
                    </div>
                </td>
                <td
                    className={'pic ' + metrics.lines.classForPercent}
                    colSpan={3}
                >
                    <div className="chart">
                        <ShowPicture num={metrics.lines.pct} />
                    </div>
                </td>
            </tr>
            {toggled &&
                children &&
                children.map(child => (
                    <SummaryTableLine
                        {...child}
                        tabSize={tabSize + 2}
                        key={child.file}
                        prefix={prefix + file + '/'}
                    />
                ))}
        </>
    );
}
