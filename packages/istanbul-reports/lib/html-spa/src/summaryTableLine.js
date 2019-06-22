import React from 'react';

function MetricCells({ metrics }) {
    const { classForPercent, pct, covered, total } = metrics;

    return (
        <>
            <td className={'pct ' + classForPercent}>{Math.round(pct)}% </td>
            <td className={classForPercent}>
                <div className="bar">
                    <div
                        className={`bar__data ${classForPercent} ${classForPercent}--dark`}
                        style={{ width: pct + '%' }}
                    ></div>
                </div>
            </td>
            <td className={'abs ' + classForPercent}>{covered}</td>
            <td className={'abs ' + classForPercent}>{total}</td>
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
                <button
                    type="button"
                    onClick={() => setExpandedLines(newExpandedLines)}
                    className="expandbutton"
                >
                    {isExpanded ? String.fromCharCode(0x2013) : '+'}
                </button>
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
                <td className={'file ' + metrics.statements.classForPercent}>
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
