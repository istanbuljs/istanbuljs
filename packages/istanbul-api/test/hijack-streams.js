const outWrite = process.stdout.write;
const errWrite = process.stderr.write;

function silent() {
    if (!process.env.DEBUG) {
        process.stdout.write = function() {};
        process.stderr.write = function() {};
    }
}

function reset() {
    process.stdout.write = outWrite;
    process.stderr.write = errWrite;
}

function wrap(cb) {
    return function(...args) {
        reset();
        cb(...args);
    };
}

module.exports = {
    silent,
    reset,
    wrap
};
