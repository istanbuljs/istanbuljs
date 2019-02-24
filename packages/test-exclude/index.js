const path = require('path');
const arrify = require('arrify');
const glob = require('glob');
const minimatch = require('minimatch');
const readPkgUp = require('read-pkg-up');
const requireMainFilename = require('require-main-filename');

class TestExclude {
    constructor(opts) {
        Object.assign(
            this,
            {
                cwd: process.cwd(),
                include: false,
                relativePath: true,
                configKey: null, // the key to load config from in package.json.
                configPath: null, // optionally override requireMainFilename.
                configFound: false,
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
        } else if (!Array.isArray(this.extension) || this.extension.length === 0) {
            this.extension = false;
        }

        if (!this.include && !this.exclude && this.configKey) {
            Object.assign(this, this.pkgConf(this.configKey, this.configPath));
        }

        if (!this.exclude || !Array.isArray(this.exclude)) {
            this.exclude = exportFunc.defaultExclude;
        }

        if (this.include && this.include.length > 0) {
            this.include = prepGlobPatterns(arrify(this.include));
        } else {
            this.include = false;
        }

        if (
            this.excludeNodeModules &&
            !this.exclude.includes('**/node_modules/**')
        ) {
            this.exclude.push('**/node_modules/**');
        }

        this.exclude = prepGlobPatterns([].concat(arrify(this.exclude)));

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
            if (/^\.\./.test(path.relative(this.cwd, filename))) {
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

    pkgConf(key, path) {
        const cwd = path || requireMainFilename(require);
        const obj = readPkgUp.sync({ cwd });

        if (obj.pkg && obj.pkg[key] && typeof obj.pkg[key] === 'object') {
            this.configFound = true;

            return obj.pkg[key];
        }

        return {};
    }

    globSync(cwd = this.cwd) {
        const sourceGlob = getExtensionPattern(this.extension || []);

        return glob
            .sync(sourceGlob, { cwd, nodir: true })
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

exportFunc.defaultExclude = [
    'coverage/**',
    'packages/*/test/**',
    'test/**',
    'test{,-*}.js',
    '**/*{.,-}test.js',
    '**/__tests__/**',
    '**/node_modules/**',
    '**/babel.config.js'
];

module.exports = exportFunc;
