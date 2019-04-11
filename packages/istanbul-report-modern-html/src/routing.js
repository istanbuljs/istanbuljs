export function setLocation(
    isReplace,
    activeSort,
    summarizerType,
    activeFilters
) {
    const pushFn = isReplace
        ? window.history.replaceState.bind(window.history)
        : window.history.pushState.bind(window.history);

    pushFn(
        null,
        '',
        `#${activeSort.sortKey}/${activeSort.order}/${summarizerType}/${
            activeFilters.low
        }/${activeFilters.medium}/${activeFilters.high}`
    );
}

export function decodeLocation() {
    const items = location.hash.substr(1).split('/');
    if (items.length !== 6) {
        return null;
    }
    return {
        activeSort: {
            sortKey: items[0],
            order: items[1]
        },
        summarizerType: items[2],
        activeFilters: {
            low: JSON.parse(items[3]),
            medium: JSON.parse(items[4]),
            high: JSON.parse(items[5])
        }
    };
}
