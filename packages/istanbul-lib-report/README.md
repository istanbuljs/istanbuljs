# istanbul-lib-report

[![Greenkeeper badge](https://badges.greenkeeper.io/istanbuljs/istanbul-lib-report.svg)](https://greenkeeper.io/)
[![Build Status](https://travis-ci.org/istanbuljs/istanbul-lib-report.svg?branch=master)](https://travis-ci.org/istanbuljs/istanbul-lib-report)

Core reporting utilities for istanbul.

## example usage

```
const libReport = require('istanbul-lib-report');

const context = libReport.createContext({
  dir: 'source/dir',
  defaultSummarizer: 'summarizer name e.g. nested/flat/pkg',
  watermarks: configWatermarks,
  coverageMap,
})

const report = reports.create('report/name e.g. json/html/html-spa/text', {
  skipEmpty: configSkipEmpty,
  skipFull: configSkipFull
})
report.execute(context)
```
