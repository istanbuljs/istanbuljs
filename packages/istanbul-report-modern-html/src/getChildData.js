function addPath(node, parentPath) {
    if (!parentPath) {
        return node;
    }
    return { ...node, file: parentPath + '/' + node.file };
}

function flatten(nodes, parentPath) {
    let children = [];
    for (var i = 0; i < nodes.length; i++) {
        let child = nodes[i];
        if (child.children) {
            children = [
                ...children.map(child => addPath(child, parentPath)),
                ...flatten(
                    child.children,
                    (!parentPath ? '' : '/' + parentPath) + child.file
                )
            ];
        } else {
            children.push(addPath(child, parentPath));
        }
    }
    return children;
}

function sort(childData, activeSort) {
    const top = activeSort.order === 'asc' ? 1 : -1;
    const bottom = activeSort.order === 'asc' ? -1 : 1;
    childData.sort((a, b) => {
        let valueA;
        let valueB;
        if (activeSort.sortKey === 'file') {
            // reverse to match original report ordering
            valueB = a.file;
            valueA = b.file;
        } else {
            const [metricType, valueType] = activeSort.sortKey.split('.');
            valueA = a.metrics[metricType][valueType];
            valueB = b.metrics[metricType][valueType];
        }

        if (valueA === valueB) {
            return 0;
        }
        return valueA < valueB ? top : bottom;
    });

    for (let i = 0; i < childData.length; i++) {
        let child = childData[i];
        if (child.children) {
            childData[i] = {
                ...child,
                children: sort(child.children, activeSort)
            };
        }
    }
    return childData;
}

function filter(nodes, activeFilters) {
    let children = [];
    for (var i = 0; i < nodes.length; i++) {
        let child = nodes[i];
        if (child.children) {
            const newSubChildren = filter(child.children, activeFilters);
            if (newSubChildren.length) {
                child = { ...child, children: newSubChildren };
                children.push(child);
            }
        } else {
            if (
                activeFilters[child.metrics.statements.classForPercent] ||
                activeFilters[child.metrics.branches.classForPercent] ||
                activeFilters[child.metrics.functions.classForPercent] ||
                activeFilters[child.metrics.lines.classForPercent]
            ) {
                children.push(child);
            }
        }
    }
    return children;
}

export default function getChildData(
    sourceData,
    activeSort,
    summarizerType,
    activeFilters
) {
    let childData;

    if (summarizerType === 'flat') {
        childData = flatten(sourceData['package'].children.slice(0));
    } else {
        childData = sourceData[summarizerType].children;
    }

    childData = filter(childData, activeFilters);

    if (activeSort) {
        childData = sort(childData, activeSort);
    }
    return childData;
}