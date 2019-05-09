# istanbul-api

[![Greenkeeper badge](https://badges.greenkeeper.io/istanbuljs/istanbul-api.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/istanbuljs/istanbul-api.svg?branch=master)](https://travis-ci.org/istanbuljs/istanbul-api)

Deprecated high-level API for istanbul.

Remaining users of this module should migrate:

-   istanbul-lib-instrument or babel-plugin-istanbul - modify sources to include coverage counters
-   istanbul-lib-coverage - merge coverage results from multiple tests into a single dataset for reporting
-   istanbul-lib-source-maps - process source-maps before generating reports
-   istanbul-lib-report - the reporting system
-   istanbul-reports - the actual reports (text-summary report, html report, etc)
