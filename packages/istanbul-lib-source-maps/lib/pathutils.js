const path = require('path');

module.exports = {
    isAbsolute: path.isAbsolute,
    asAbsolute(file, baseDir) {
        return path.isAbsolute(file)
            ? file
            : path.resolve(baseDir || process.cwd(), file);
    },
    relativeTo(file, origFile) {
        return path.isAbsolute(file)
            ? file
            : path.resolve(path.dirname(origFile), file);
    }
};
