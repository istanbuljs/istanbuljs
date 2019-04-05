import * as React from 'react';

function getSortDetails(sortKey, activeSort) {
    const newSort = { sortKey, order: 'asc' };
    let sortClass = '';
    if (activeSort && activeSort.sortKey === sortKey) {
        sortClass = 'sorted';
        if (activeSort.order === 'asc') {
            newSort.order = 'desc';
        } else {
            sortClass += '-desc';
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
        <>
            <th class="pct" onClick={() => onSort(newSort)}>
                {name}
            </th>
            <th class={'abs ' + sortClass} onClick={() => onSort(newSort)}>
                <span class="sorter" />
            </th>
        </>
    );
}

function FileHeaderCell({ onSort, activeSort }) {
    const { newSort, sortClass } = getSortDetails('file', activeSort);

    return (
        <th class={'file ' + sortClass} onClick={() => onSort(newSort)}>
            File
            <span class="sorter" />
        </th>
    );
}

export default function SummaryTableHeader({ onSort, activeSort }) {
    return (
        <thead>
            <tr>
                <FileHeaderCell onSort={onSort} activeSort={activeSort} />
                <th class="pic" />
                <SummaryTableHeaderCell
                    name="Statements"
                    onSort={onSort}
                    sortKey="statements"
                    activeSort={activeSort}
                />
                <SummaryTableHeaderCell
                    name="Branches"
                    onSort={onSort}
                    sortKey="branches"
                    activeSort={activeSort}
                />
                <SummaryTableHeaderCell
                    name="Functions"
                    onSort={onSort}
                    sortKey="functions"
                    activeSort={activeSort}
                />
                <SummaryTableHeaderCell
                    name="Lines"
                    onSort={onSort}
                    sortKey="lines"
                    activeSort={activeSort}
                />
            </tr>
        </thead>
    );
}
