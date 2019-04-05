import * as React from 'react';

function SummaryTableHeaderCell({ name, onSort, sortKey, activeSort }) {
    const newSort = { sortKey, order: 'asc' };
    if (
        activeSort &&
        activeSort.sortKey === sortKey &&
        activeSort.order === 'asc'
    ) {
        newSort.order = 'desc';
    }
    return (
        <>
            <th class="pct" onClick={() => onSort(newSort)}>
                {name}
            </th>
            <th class="abs" onClick={() => onSort(newSort)} />
        </>
    );
}

export default function SummaryTableHeader({ onSort, activeSort }) {
    return (
        <thead>
            <tr>
                <th class="file">File</th>
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
