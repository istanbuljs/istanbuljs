import * as React from 'react';

function getSortDetails(sortKey, activeSort) {
    let newSort = { sortKey, order: 'desc' };
    let sortClass = '';
    if (activeSort && activeSort.sortKey === sortKey) {
        sortClass = 'sorted';
        if (activeSort.order === 'desc') {
            sortClass += '-desc';
            newSort.order = 'asc';
        } else {
            if (sortKey !== 'file') {
                newSort = { sortKey: 'file', order: 'desc' };
            }
        }
    }

    return {
        newSort,
        sortClass
    };
}

function SummaryTableHeaderCell({ name, onSort, sortKey, activeSort }) {
    const { newSort, sortClass } = getSortDetails(sortKey, activeSort);
    return (
        <th
            className={'sortable headercell ' + sortClass}
            onClick={() => onSort(newSort)}
        >
            {name}
            <span className="sorter" />
        </th>
    );
}

function FileHeaderCell({ onSort, activeSort }) {
    const { newSort, sortClass } = getSortDetails('file', activeSort);

    return (
        <th
            className={'sortable file ' + sortClass}
            onClick={() => onSort(newSort)}
        >
            File
            <span className="sorter" />
        </th>
    );
}

function SubHeadings({ sortKeyPrefix, onSort, activeSort }) {
    return (
        <>
            <SummaryTableHeaderCell
                name="%"
                onSort={onSort}
                sortKey={sortKeyPrefix + '.pct'}
                activeSort={activeSort}
            />
            <SummaryTableHeaderCell
                name="Covered"
                onSort={onSort}
                sortKey={sortKeyPrefix + '.covered'}
                activeSort={activeSort}
            />
            <SummaryTableHeaderCell
                name="Total"
                onSort={onSort}
                sortKey={sortKeyPrefix + '.total'}
                activeSort={activeSort}
            />
        </>
    );
}

export default function SummaryTableHeader({ onSort, activeSort }) {
    return (
        <thead>
            <tr className="topheading">
                <FileHeaderCell onSort={onSort} activeSort={activeSort} />
                <th colSpan={3}>Statements</th>
                <th colSpan={3}>Branches</th>
                <th colSpan={3}>Functions</th>
                <th colSpan={3}>Lines</th>
            </tr>
            <tr className="subheading">
                <th />
                <SubHeadings
                    sortKeyPrefix="statements"
                    onSort={onSort}
                    activeSort={activeSort}
                />
                <SubHeadings
                    sortKeyPrefix="branches"
                    onSort={onSort}
                    activeSort={activeSort}
                />
                <SubHeadings
                    sortKeyPrefix="functions"
                    onSort={onSort}
                    activeSort={activeSort}
                />
                <SubHeadings
                    sortKeyPrefix="lines"
                    onSort={onSort}
                    activeSort={activeSort}
                />
            </tr>
        </thead>
    );
}
