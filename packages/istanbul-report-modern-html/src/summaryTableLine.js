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
                <div class={'cover-fill' + cls} style={{ width: num + '%' }} />
                <div class="cover-empty" style={{ width: rest + '%' }} />
            </>
        );
    } else {
        return false;
    }
}

function MetricCells({ metrics }) {
    return (
        <>
            <td class={'pct ' + metrics.classForPercent}>{metrics.pct}%</td>
            <td class={'abs ' + metrics.classForPercent}>{metrics.covered}</td>
            <td class={'abs ' + metrics.classForPercent}>{metrics.total}</td>
        </>
    );
}

export default function SummaryTableLine({ metrics, file, children, tabSize }) {
    const [toggled, setToggled] = React.useState(false);
    tabSize = tabSize || 0;
    if (children && tabSize > 0) {
        tabSize--;
    }

    return (
        <>
            <tr>
                <td
                    class={'file ' + metrics.statements.classForPercent}
                    rowSpan={2}
                >
                    {Array.apply(null, { length: tabSize }).map(() => (
                        <span class="filetab" />
                    ))}
                    {children ? (
                        <a
                            onClick={() => setToggled(!toggled)}
                            class="expandbutton"
                        >
                            {toggled ? String.fromCharCode(0x2013) : '+'}
                        </a>
                    ) : (
                        false
                    )}
                    <a>{file}</a>
                </td>
                <MetricCells metrics={metrics.statements} />
                <MetricCells metrics={metrics.branches} />
                <MetricCells metrics={metrics.functions} />
                <MetricCells metrics={metrics.lines} />
            </tr>
            <tr>
                <td
                    class={'pic ' + metrics.statements.classForPercent}
                    colSpan={3}
                >
                    <div class="chart">
                        <ShowPicture num={metrics.statements.pct} />
                    </div>
                </td>
                <td
                    class={'pic ' + metrics.branches.classForPercent}
                    colSpan={3}
                >
                    <div class="chart">
                        <ShowPicture num={metrics.branches.pct} />
                    </div>
                </td>
                <td
                    class={'pic ' + metrics.functions.classForPercent}
                    colSpan={3}
                >
                    <div class="chart">
                        <ShowPicture num={metrics.functions.pct} />
                    </div>
                </td>
                <td class={'pic ' + metrics.lines.classForPercent} colSpan={3}>
                    <div class="chart">
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
                    />
                ))}
        </>
    );
}
