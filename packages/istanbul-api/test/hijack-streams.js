var outWrite = process.stdout.write,
    errWrite = process.stderr.write;

function silent() {
    if (!process.env.DEBUG) {
        process.stdout.write = function () {};
        process.stderr.write = function () {};
    }
}

function reset() {
    process.stdout.write = outWrite;
    process.stderr.write = errWrite;
}

function wrap(cb) {
    return function () {
        reset();
        cb.apply(null, Array.prototype.slice.call(arguments));
    };
}


module.exports = {
    silent: silent,
    reset: reset,
    wrap: wrap
};
