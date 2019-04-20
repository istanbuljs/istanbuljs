import React from 'react';

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

function FileCell({
    file,
    prefix,
    expandedLines,
    setExpandedLines,
    hasChildren,
    setFileFilter
}) {
    if (hasChildren) {
        const expandedIndex = expandedLines.indexOf(prefix + file);
        const isExpanded = expandedIndex >= 0;
        const newExpandedLines = isExpanded
            ? [
                  ...expandedLines.slice(0, expandedIndex),
                  ...expandedLines.slice(expandedIndex + 1)
              ]
            : [...expandedLines, prefix + file];

        return (
            <>
                <a
                    href="javascript:void(0)"
                    onClick={() => setExpandedLines(newExpandedLines)}
                    className="expandbutton"
                >
                    {isExpanded ? String.fromCharCode(0x2013) : '+'}
                </a>
                <a
                    href="javascript:void(0)"
                    onClick={() => setFileFilter(prefix + file)}
                >
                    {file}
                </a>
            </>
        );
    } else {
        return <a href={`./${prefix}${file}.html`}>{file}</a>;
    }
}

export default function SummaryTableLine({
    prefix,
    metrics,
    file,
    children,
    tabSize,
    metricsToShow,
    expandedLines,
    setExpandedLines,
    fileFilter,
    setFileFilter
}) {
    tabSize = tabSize || 0;
    if (children && tabSize > 0) {
        tabSize--;
    }
    prefix = (fileFilter ? fileFilter + '/' : '') + (prefix || '');

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
                    <FileCell
                        file={file}
                        prefix={prefix}
                        expandedLines={expandedLines}
                        setExpandedLines={setExpandedLines}
                        hasChildren={Boolean(children)}
                        setFileFilter={setFileFilter}
                    />
                </td>
                {metricsToShow.statements && (
                    <MetricCells metrics={metrics.statements} />
                )}
                {metricsToShow.branches && (
                    <MetricCells metrics={metrics.branches} />
                )}
                {metricsToShow.functions && (
                    <MetricCells metrics={metrics.functions} />
                )}
                {metricsToShow.lines && <MetricCells metrics={metrics.lines} />}
            </tr>
            <tr>
                {metricsToShow.statements && (
                    <td
                        className={'pic ' + metrics.statements.classForPercent}
                        colSpan={3}
                    >
                        <div className="chart">
                            <ShowPicture num={metrics.statements.pct} />
                        </div>
                    </td>
                )}
                {metricsToShow.branches && (
                    <td
                        className={'pic ' + metrics.branches.classForPercent}
                        colSpan={3}
                    >
                        <div className="chart">
                            <ShowPicture num={metrics.branches.pct} />
                        </div>
                    </td>
                )}
                {metricsToShow.functions && (
                    <td
                        className={'pic ' + metrics.functions.classForPercent}
                        colSpan={3}
                    >
                        <div className="chart">
                            <ShowPicture num={metrics.functions.pct} />
                        </div>
                    </td>
                )}
                {metricsToShow.lines && (
                    <td
                        className={'pic ' + metrics.lines.classForPercent}
                        colSpan={3}
                    >
                        <div className="chart">
                            <ShowPicture num={metrics.lines.pct} />
                        </div>
                    </td>
                )}
            </tr>
            {children &&
                expandedLines.indexOf(prefix + file) >= 0 &&
                children.map(child => (
                    <SummaryTableLine
                        {...child}
                        tabSize={tabSize + 2}
                        key={child.file}
                        prefix={prefix + file + '/'}
                        metricsToShow={metricsToShow}
                        expandedLines={expandedLines}
                        setExpandedLines={setExpandedLines}
                        setFileFilter={setFileFilter}
                    />
                ))}
        </>
    );
}
