/*
 Copyright 2012-2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
var path = require('path');
var fs = require('fs');
var mkdirp = require('make-dir');
var compareVersions = require('compare-versions');
var matcherFor = require('./file-matcher').matcherFor;
var libInstrument = require('istanbul-lib-instrument');
var libCoverage = require('istanbul-lib-coverage');
var libSourceMaps = require('istanbul-lib-source-maps');
var hook = require('istanbul-lib-hook');
var Reporter = require('./reporter');

function getCoverFunctions(config, includes, callback) {
    if (!callback && typeof includes === 'function') {
        callback = includes;
        includes = null;
    }

    var includePid = config.instrumentation.includePid();
    var reportingDir = path.resolve(config.reporting.dir());
    var reporter = new Reporter(config);
    var excludes = config.instrumentation.excludes(true);
    // The coverage variable below should have different value than
    // that of the coverage variable actually used by the instrumenter (in this case: __coverage__).
    // Otherwise if you run nyc to provide coverage on these files,
    // both the actual instrumenter and this file will write to the global coverage variable,
    // and provide unexpected coverage result.
    var coverageVar = '$$coverage$$';
    var instOpts = config.instrumentation.getInstrumenterOpts();
    var sourceMapStore = libSourceMaps.createSourceMapStore({});
    var instrumenter;
    var transformer;
    var runInContextTransformer;
    var runInThisContextTransformer;
    var fakeRequire;
    var requireTransformer;
    var reportInitFn;
    var hookFn;
    var unhookFn;
    var coverageFinderFn;
    var coverageSetterFn;
    var beforeReportFn;
    var exitFn;

    instOpts.coverageVariable = coverageVar;
    instOpts.sourceMapUrlCallback = function(file, url) {
        sourceMapStore.registerURL(file, url);
    };
    coverageFinderFn = function() {
        return global[coverageVar];
    };
    instrumenter = libInstrument.createInstrumenter(instOpts);
    transformer = function(code, options) {
        var filename = typeof options === 'string' ? options : options.filename;
        return instrumenter.instrumentSync(code, filename);
    };
    runInContextTransformer = function(code, options) {
        return transformer(code, options);
    };
    runInThisContextTransformer = function(code, options) {
        return transformer(code, options);
    };
    requireTransformer = function(code, options) {
        var cov;
        var ret = transformer(code, options);
        var filename = typeof options === 'string' ? options : options.filename;
        if (fakeRequire) {
            cov = coverageFinderFn();
            cov[filename] = instrumenter.lastFileCoverage();
            return 'function x() {}';
        }
        return ret;
    };

    coverageSetterFn = function(cov) {
        global[coverageVar] = cov;
    };

    reportInitFn = function() {
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

    var disabler;
    hookFn = function(matchFn) {
        var hookOpts = {
            verbose: config.verbose,
            extensions: config.instrumentation.extensions(),
            coverageVariable: coverageVar
        };

        //initialize the global variable
        coverageSetterFn({});
        reportInitFn();

        if (config.hooks.hookRunInContext()) {
            hook.hookRunInContext(matchFn, runInContextTransformer, hookOpts);
        }
        if (config.hooks.hookRunInThisContext()) {
            hook.hookRunInThisContext(
                matchFn,
                runInThisContextTransformer,
                hookOpts
            );
            if (compareVersions(process.versions.node, '6.0.0') === -1) {
                disabler = hook.hookRequire(
                    matchFn,
                    requireTransformer,
                    hookOpts
                );
            }
        } else {
            disabler = hook.hookRequire(matchFn, requireTransformer, hookOpts);
        }
    };

    unhookFn = function(matchFn) {
        if (disabler) {
            disabler();
        }
        hook.unhookRunInThisContext();
        hook.unhookRunInContext();
        hook.unloadRequireCache(matchFn);
    };

    beforeReportFn = function(matchFn, cov) {
        var pidExt = includePid ? '-' + process.pid : '';
        var file = path.resolve(
            reportingDir,
            'coverage' + pidExt + '.raw.json'
        );
        var missingFiles;
        var finalCoverage = cov;

        if (config.instrumentation.includeAllSources()) {
            if (config.verbose) {
                console.error("Including all sources not require'd by tests");
            }
            missingFiles = [];
            // Files that are not touched by code ran by the test runner is manually instrumented, to
            // illustrate the missing coverage.
            matchFn.files.forEach(file => {
                if (!cov[file]) {
                    missingFiles.push(file);
                }
            });

            fakeRequire = true;
            missingFiles.forEach(file => {
                try {
                    require(file);
                } catch (ex) {
                    console.error('Unable to post-instrument: ' + file);
                }
            });
        }
        if (Object.keys(finalCoverage).length > 0) {
            if (config.verbose) {
                console.error(
                    '============================================================================='
                );
                console.error('Writing coverage object [' + file + ']');
                console.error(
                    'Writing coverage reports at [' + reportingDir + ']'
                );
                console.error(
                    '============================================================================='
                );
            }
            fs.writeFileSync(file, JSON.stringify(finalCoverage), 'utf8');
        }
        return finalCoverage;
    };

    exitFn = function(matchFn, reporterOpts) {
        var cov;
        var coverageMap;
        var transformed;

        cov = coverageFinderFn() || {};
        cov = beforeReportFn(matchFn, cov);
        coverageSetterFn(cov);

        if (
            !(cov && typeof cov === 'object') ||
            Object.keys(cov).length === 0
        ) {
            console.error(
                'No coverage information was collected, exit without writing coverage information'
            );
            return;
        }

        coverageMap = libCoverage.createCoverageMap(cov);
        transformed = sourceMapStore.transformCoverage(coverageMap);
        reporterOpts.sourceFinder = transformed.sourceFinder;
        reporter.write(transformed.map, reporterOpts);
        sourceMapStore.dispose();
    };

    excludes.push(
        path.relative(process.cwd(), path.join(reportingDir, '**', '*'))
    );
    includes =
        includes ||
        config.instrumentation.extensions().map(ext => '**/*' + ext);
    var matchConfig = {
        root:
            config.instrumentation.root() ||
            /* istanbul ignore next: untestable */ process.cwd(),
        includes,
        excludes
    };
    matcherFor(matchConfig, (err, matchFn) => {
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
    getCoverFunctions
};
