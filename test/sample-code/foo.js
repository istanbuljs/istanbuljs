function boundToTen(x) {
    return x < 10 ? x : 10;
}

function lessThan(x, y) {
    return x < y;
}

// call bind in mainline
boundToTen(9);

if (typeof module !== 'undefined') {
    module.exports = {
        boundToTen: boundToTen,
        lessThan: lessThan
    };
}
