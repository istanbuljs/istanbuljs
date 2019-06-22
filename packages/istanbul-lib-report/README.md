# istanbul-lib-report

[![Greenkeeper badge](https://badges.greenkeeper.io/istanbuljs/istanbul-lib-report.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/istanbuljs/istanbul-lib-report.svg?branch=master)](https://travis-ci.org/istanbuljs/istanbul-lib-report)

Core reporting utilities for istanbul.

## Example usage

```js
const libReport = require('istanbul-lib-report');
const reports = require('istanbul-reports');

// create a context for report generation
const context = libReport.createContext({
  dir: 'report/output/dir',
  defaultSummarizer: 'summarizer name e.g. nested/flat/pkg',
  watermarks: configWatermarks,
  coverageMap,
})

// create an instance of the relevant report class
const report = reports.create('report/name e.g. json/html/html-spa/text', {
  skipEmpty: configSkipEmpty,
  skipFull: configSkipFull
})

// call execute to synchronously create and write the report to disk
report.execute(context)
```
