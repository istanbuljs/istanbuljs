/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var path = require('path'),
    fs = require('fs'),
    mkdirp = require('mkdirp'),
    clone = require('clone'),
    matcherFor = require('./file-matcher').matcherFor,
    libInstrument = require('istanbul-lib-instrument'),
    libCoverage = require('istanbul-lib-coverage'),
    libSourceMaps = require('istanbul-lib-source-maps'),
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
        sourceMapStore = libSourceMaps.createSourceMapStore({}),
        instrumenter,
        transformer,
        reportInitFn,
        hookFn,
        unhookFn,
        coverageFinderFn,
        coverageSetterFn,
        beforeReportFn,
        exitFn;

    instOpts.coverageVariable = coverageVar;
    instOpts.sourceMapUrlCallback = function (file, url) {
        sourceMapStore.registerURL(file, url);
    };
    instrumenter = libInstrument.createInstrumenter(instOpts);
    transformer = function (code, file) {
        return instrumenter.instrumentSync(code, file);
    };

    coverageFinderFn = function () {
        return global[coverageVar];
    };

    coverageSetterFn = function (cov) {
        global[coverageVar] = cov;
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
        coverageSetterFn({});
        reportInitFn();

        if (config.hooks.hookRunInContext()) {
            hook.hookRunInThisContext(matchFn, transformer, hookOpts);
        }
        hook.hookRequire(matchFn, transformer, hookOpts);
    };

    unhookFn = function (matchFn) {
        hook.unhookRequire();
        hook.unhookRunInThisContext();
        hook.unloadRequireCache(matchFn);
    };

    beforeReportFn = function (matchFn, cov) {
        var pidExt = includePid ? ('-' + process.pid) : '',
            file = path.resolve(reportingDir, 'coverage' + pidExt + '.raw.json'),
            missingFiles,
            finalCoverage = cov;

        if (config.instrumentation.includeAllSources()) {
            // ensure we don't increase the coverage of existing tested files
            // in any way when we require untested files
            if (config.verbose) {
                console.error("Including all sources not require'd by tests");
            }
            missingFiles = [];
            // Files that are not touched by code ran by the test runner is manually instrumented, to
            // illustrate the missing coverage.
            matchFn.files.forEach(function (file) {
                if (!cov[file]) {
                    missingFiles.push(file);
                }
            });
            if (missingFiles.length > 0) {
                finalCoverage = clone(cov);
                missingFiles.forEach(function (file) {
                    try {
                        require(file);
                    } catch (ex) {
                        console.error('Unable to post-instrument: ' + file);
                    }
                });
                missingFiles.forEach(function (file) {
                    var fc;
                    if (cov[file]) {
                        fc = libCoverage.createFileCoverage(cov[file]);
                        fc.resetHits();
                        finalCoverage[file] = fc.toJSON();
                    }
                });
            }
        }
        if (Object.keys(finalCoverage).length >0) {
            if (config.verbose) {
                console.error('=============================================================================');
                console.error('Writing coverage object [' + file + ']');
                console.error('Writing coverage reports at [' + reportingDir + ']');
                console.error('=============================================================================');
            }
            fs.writeFileSync(file, JSON.stringify(finalCoverage), 'utf8');
        }
        return finalCoverage;
    };

    exitFn = function (matchFn, reporterOpts) {
        var cov,
            coverageMap,
            transformed;

        cov = coverageFinderFn() || {};
        cov = beforeReportFn(matchFn, cov);
        coverageSetterFn(cov);

        if (!(cov && typeof cov === 'object') || Object.keys(cov).length === 0) {
            console.error('No coverage information was collected, exit without writing coverage information');
            return;
        }

        coverageMap = libCoverage.createCoverageMap(cov);
        transformed = sourceMapStore.transformCoverage(coverageMap);
        reporterOpts.sourceFinder = transformed.sourceFinder;
        reporter.write(transformed.map, reporterOpts);
        sourceMapStore.dispose();
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
        if (err) {
            return callback(err);
        }
        return callback(null, {
            coverageFn: coverageFinderFn,
            hookFn: hookFn.bind(null, matchFn),
            exitFn: exitFn.bind(null, matchFn, {}), // XXX: reporter opts
            unhookFn: unhookFn.bind(null, matchFn)
        });
    });
}

module.exports = {
    getCoverFunctions: getCoverFunctions
};

