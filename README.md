# IstanbulJS

[![Build Status](https://travis-ci.org/istanbuljs/istanbuljs.svg?branch=master)](https://travis-ci.org/istanbuljs/istanbuljs)
[![Coverage Status](https://coveralls.io/repos/istanbuljs/istanbuljs/badge.svg?branch=master)](https://coveralls.io/r/istanbuljs/istanbuljs?branch=master)

> Everyone's favorite JS code coverage tool.

## About this Repo

This [monorepo](https://github.com/babel/babel/blob/master/doc/design/monorepo.md) contains the _nuts and bolts_ utility libraries that facilitate IstanbulJS test coverage; Why a monorepo?

* it allows us to more easily test API changes across coupled modules, e.g., changes to `istanbul-lib-coverage`
  potentially have an effect on `istanbul-lib-instrument`.
* it gives us a centralized repo for discussions about bugs and upcoming features.

## Getting Started

_You're probably actually looking for one of the following repos:_

* [nyc](https://github.com/istanbuljs/nyc): the IstanbulJS 2.0 command line interface. It supports
  require hooks, subprocesses, and is really quite awesome.
* [babel-plugin-istanbul](https://github.com/istanbuljs/babel-plugin-istanbul): a babel plugin
 for instrumenting your ES6 code with Istanbul compatible coverage tracking.
* [istanbul](https://github.com/gotwarlost/istanbul): the legacy 1.0 IstanbulJS interface (you should
  now consider instead using nyc or babel-plugin-istanbul).
