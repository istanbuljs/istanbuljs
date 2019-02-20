const path = require('path');

function isAbsolute(p) {
    if (path.isAbsolute) {
        return path.isAbsolute(p);
    }

    return path.resolve(p) === path.normalize(p);
}

module.exports = {
    isAbsolute,
    asAbsolute(file, baseDir) {
        return isAbsolute(file)
            ? file
            : path.resolve(baseDir || process.cwd(), file);
    },
    relativeTo(file, origFile) {
        return isAbsolute(file)
            ? file
            : path.resolve(path.dirname(origFile), file);
    }
};
