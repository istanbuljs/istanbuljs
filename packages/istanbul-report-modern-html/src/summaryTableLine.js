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

export default function SummaryTableLine({ metrics, file, children }) {
    const [toggled, setToggled] = React.useState(false);

    return (
        <>
            <tr>
                <td class={'file ' + metrics.statements.classForPercent}>
                    {children ? (
                        <a
                            onClick={() => setToggled(!toggled)}
                            class="expandbutton"
                        >
                            {toggled ? '—' : '+'}
                        </a>
                    ) : (
                        false
                    )}
                    <a>{file}</a>
                </td>
                <td class={'pic ' + metrics.statements.classForPercent}>
                    <div class="chart">
                        <ShowPicture num={metrics.statements.pct} />
                    </div>
                </td>
                <td class={'pct ' + metrics.statements.classForPercent}>
                    {metrics.statements.pct}%
                </td>
                <td class={'abs ' + metrics.statements.classForPercent}>
                    {metrics.statements.covered}/{metrics.statements.total}
                </td>
                <td class={'pct ' + metrics.branches.classForPercent}>
                    {metrics.branches.pct}%
                </td>
                <td class={'abs ' + metrics.branches.classForPercent}>
                    {metrics.branches.covered}/{metrics.branches.total}
                </td>
                <td class={'pct ' + metrics.functions.classForPercent}>
                    {metrics.functions.pct}%
                </td>
                <td class={'abs ' + metrics.functions.classForPercent}>
                    {metrics.functions.covered}/{metrics.functions.total}
                </td>
                <td class={'pct ' + metrics.lines.classForPercent}>
                    {metrics.lines.pct}%
                </td>
                <td class={'abs ' + metrics.lines.classForPercent}>
                    {metrics.lines.covered}/{metrics.lines.total}
                </td>
            </tr>
            {toggled && children.map(child => <SummaryTableLine {...child} />)}
        </>
    );
}
