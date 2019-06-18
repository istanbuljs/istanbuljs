'use strict';

const path = require('path');
const glob = require('glob');
const minimatch = require('minimatch');
const defaultExclude = require('./default-exclude');
const isOutsideDir = require('./is-outside-dir');

class TestExclude {
    constructor(opts) {
        Object.assign(
            this,
            {
                cwd: process.cwd(),
                include: false,
                relativePath: true,
                excludeNodeModules: true,
                extension: false
            },
            opts
        );

        if (typeof this.include === 'string') {
            this.include = [this.include];
        }

        if (typeof this.exclude === 'string') {
            this.exclude = [this.exclude];
        }

        if (typeof this.extension === 'string') {
            this.extension = [this.extension];
        } else if (
            !Array.isArray(this.extension) ||
            this.extension.length === 0
        ) {
            this.extension = false;
        }

        if (!this.exclude || !Array.isArray(this.exclude)) {
            this.exclude = defaultExclude;
        }

        if (this.include && this.include.length > 0) {
            this.include = prepGlobPatterns([].concat(this.include));
        } else {
            this.include = false;
        }

        if (
            this.excludeNodeModules &&
            !this.exclude.includes('**/node_modules/**')
        ) {
            this.exclude = this.exclude.concat('**/node_modules/**');
        }

        this.exclude = prepGlobPatterns([].concat(this.exclude));

        this.handleNegation();
    }

    /* handle the special case of negative globs
     * (!**foo/bar); we create a new this.excludeNegated set
     * of rules, which is applied after excludes and we
     * move excluded include rules into this.excludes.
     */
    handleNegation() {
        const noNeg = e => e.charAt(0) !== '!';
        const onlyNeg = e => e.charAt(0) === '!';
        const stripNeg = e => e.slice(1);

        if (Array.isArray(this.include)) {
            const includeNegated = this.include.filter(onlyNeg).map(stripNeg);
            this.exclude.push(...prepGlobPatterns(includeNegated));
            this.include = this.include.filter(noNeg);
        }

        this.excludeNegated = this.exclude.filter(onlyNeg).map(stripNeg);
        this.exclude = this.exclude.filter(noNeg);
        this.excludeNegated = prepGlobPatterns(this.excludeNegated);
    }

    shouldInstrument(filename, relFile) {
        if (
            this.extension &&
            !this.extension.some(ext => filename.endsWith(ext))
        ) {
            return false;
        }

        let pathToCheck = filename;

        if (this.relativePath) {
            relFile = relFile || path.relative(this.cwd, filename);

            // Don't instrument files that are outside of the current working directory.
            if (isOutsideDir(this.cwd, filename)) {
                return false;
            }

            pathToCheck = relFile.replace(/^\.[\\/]/, ''); // remove leading './' or '.\'.
        }

        const dot = { dot: true };
        const matches = pattern => minimatch(pathToCheck, pattern, dot);
        return (
            (!this.include || this.include.some(matches)) &&
            (!this.exclude.some(matches) || this.excludeNegated.some(matches))
        );
    }

    globSync(cwd = this.cwd) {
        const globPatterns = getExtensionPattern(this.extension || []);
        const globOptions = { cwd, nodir: true, dot: true };
        /* If we don't have any excludeNegated then we can optimize glob by telling
         * it to not iterate into unwanted directory trees (like node_modules). */
        if (this.excludeNegated.length === 0) {
            globOptions.ignore = this.exclude;
        }

        return glob
            .sync(globPatterns, globOptions)
            .filter(file => this.shouldInstrument(path.resolve(cwd, file)));
    }
}

function prepGlobPatterns(patterns) {
    return patterns.reduce((result, pattern) => {
        // Allow gitignore style of directory exclusion
        if (!/\/\*\*$/.test(pattern)) {
            result = result.concat(pattern.replace(/\/$/, '') + '/**');
        }

        // Any rules of the form **/foo.js, should also match foo.js.
        if (/^\*\*\//.test(pattern)) {
            result = result.concat(pattern.replace(/^\*\*\//, ''));
        }

        return result.concat(pattern);
    }, []);
}

function getExtensionPattern(extension) {
    switch (extension.length) {
        case 0:
            return '**';
        case 1:
            return `**/*${extension[0]}`;
        default:
            return `**/*{${extension.join()}}`;
    }
}

const exportFunc = opts => new TestExclude(opts);

exportFunc.defaultExclude = defaultExclude;

module.exports = exportFunc;
