import * as React from 'react';

function SummaryTableHeaderCell({ name, onSort, sortKey }) {
    return (
        <>
            <th class="pct" onClick={() => onSort(sortKey)}>
                {name}
            </th>
            <th class="abs" onClick={() => onSort(sortKey)} />
        </>
    );
}

export default function SummaryTableHeader({ onSort }) {
    return (
        <thead>
            <tr>
                <th class="file">File</th>
                <th class="pic" />
                <SummaryTableHeaderCell
                    name="Statements"
                    onSort={onSort}
                    sortKey="statements"
                />
                <SummaryTableHeaderCell
                    name="Branches"
                    onSort={onSort}
                    sortKey="branches"
                />
                <SummaryTableHeaderCell
                    name="Functions"
                    onSort={onSort}
                    sortKey="functions"
                />
                <SummaryTableHeaderCell
                    name="Lines"
                    onSort={onSort}
                    sortKey="lines"
                />
            </tr>
        </thead>
    );
}
