import * as React from 'react';

function FilterButton({ children, filter, activeFilters, setFilters }) {
    return (
        <button
            className={
                'togglebutton ' + (activeFilters[filter] ? 'enabled' : '')
            }
            onClick={() =>
                setFilters({
                    ...activeFilters,
                    [filter]: !activeFilters[filter]
                })
            }
        >
            {children}
        </button>
    );
}

export default function FilterButtons({ activeFilters, setFilters }) {
    return (
        <div className="buttongroup">
            <label>Coverage:</label>
            <FilterButton
                filter="low"
                activeFilters={activeFilters}
                setFilters={setFilters}
            >
                Low
            </FilterButton>
            <FilterButton
                filter="medium"
                activeFilters={activeFilters}
                setFilters={setFilters}
            >
                Medium
            </FilterButton>
            <FilterButton
                filter="high"
                activeFilters={activeFilters}
                setFilters={setFilters}
            >
                High
            </FilterButton>
        </div>
    );
}
