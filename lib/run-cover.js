/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    matcherFor = require('./file-matcher').matcherFor,
    libInstrument = require('istanbul-lib-instrument'),
    libCoverage = require('istanbul-lib-coverage'),
    hook = require('istanbul-lib-hook'),
    Reporter = require('./reporter');

function getCoverFunctions(config, includes, callback) {

    if (!callback && typeof includes === 'function') {
        callback = includes;
        includes = null;
    }

    var includePid = config.instrumentation.includePid(),
        reportingDir = path.resolve(config.reporting.dir()),
        reporter = new Reporter(config),
        excludes = config.instrumentation.excludes(true),
        coverageVar = '$$cov_' + new Date().getTime() + '$$',
        instOpts = config.instrumentation.getInstrumenterOpts(),
        instrumenter,
        transformer,
        reportInitFn,
        hookFn,
        coverageFinderFn,
        beforeReportFn,
        exitFn;

    instOpts.coverageVariable = coverageVar;
    instrumenter = libInstrument.createInstrumenter(instOpts);
    transformer = instrumenter.instrumentSync.bind(instrumenter);

    coverageFinderFn = function () {
        return global[coverageVar];
    };

    reportInitFn = function () {
        // set up reporter
        mkdirp.sync(reportingDir); //ensure we fail early if we cannot do this
        reporter.addAll(config.reporting.reports());
        if (config.reporting.print() !== 'none') {
            switch (config.reporting.print()) {
                case 'detail':
                    reporter.add('text');
                    break;
                case 'both':
                    reporter.add('text');
                    reporter.add('text-summary');
                    break;
                default:
                    reporter.add('text-summary');
                    break;
            }
        }
    };

    hookFn = function (matchFn) {
        var hookOpts = {
            verbose: config.verbose,
            extensions: config.instrumentation.extensions()
        };

        //initialize the global variable
        global[coverageVar] = {};

        reportInitFn();
        // internal to istanbul
        /* istanbul ignore else */
        if (config['self-test']) {
            hook.unloadRequireCache(matchFn);
        }
        // runInThisContext is used by RequireJS [issue #23]
        if (config.hooks.hookRunInContext()) {
            hook.hookRunInThisContext(matchFn, transformer, hookOpts);
        }
        hook.hookRequire(matchFn, transformer, hookOpts);
    };

    beforeReportFn = function (matchFn, cov) {
        var pidExt = includePid ? ('-' + process.pid) : '',
            file = path.resolve(reportingDir, 'coverage' + pidExt + '.raw.json');

        if (config.instrumentation.includeAllSources()) {
            if (config.verbose) {
                console.error("Including all sources not require'd by tests");
            }
            // Files that are not touched by code ran by the test runner is manually instrumented, to
            // illustrate the missing coverage.
            matchFn.files.forEach(function (file) {
                if (!cov[file]) {
                    try {
                        transformer(fs.readFileSync(file, 'utf-8'), file);
                        cov[file] = instrumenter.lastFileCoverage();
                    } catch (ex) {
                        console.error('Unable to post-instrument: ' + file);
                    }
                }
            });
        }
        if (config.verbose) {
            console.error('=============================================================================');
            console.error('Writing coverage object [' + file + ']');
            console.error('Writing coverage reports at [' + reportingDir + ']');
            console.error('=============================================================================');
        }
        fs.writeFileSync(file, JSON.stringify(cov), 'utf8');
    };

    exitFn = function (matchFn, reporterOpts) {
        var cov,
            coverageMap;

        cov = coverageFinderFn();
        if (!(cov && typeof cov === 'object') || Object.keys(cov).length === 0) {
            console.error('No coverage information was collected, exit without writing coverage information');
            return;
        }

        beforeReportFn(matchFn, cov);
        coverageMap = libCoverage.createCoverageMap(cov);
        reporter.write(coverageMap, reporterOpts);
    };

    excludes.push(path.relative(process.cwd(), path.join(reportingDir, '**', '*')));
    includes = includes || config.instrumentation.extensions().map(function (ext) {
        return '**/*' + ext;
    });
    var matchConfig = {
        root: config.instrumentation.root() || /* istanbul ignore next: untestable */ process.cwd(),
        includes: includes,
        excludes: excludes
    };
    matcherFor(matchConfig, function (err, matchFn) {
        /* istanbul ignore if: untestable */
        if (err) { return callback(err); }
        return callback(null, {
            coverageVar: coverageVar,
            hookFn: hookFn.bind(null, matchFn),
            exitFn: exitFn.bind(null, matchFn, {})
        });
    });
}

module.exports = {
    getCoverFunctions: getCoverFunctions
};

