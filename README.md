istanbul-lib-instrument
-----------------------

[![Build Status](https://travis-ci.org/istanbuljs/istanbul-lib-instrument.svg?branch=master)](https://travis-ci.org/istanbuljs/istanbul-lib-instrument)

Istanbul instrumenter library.

Version 1.1.x now implements instrumentation using `Babel`. It provides 2 "modes"
of instrumentation.

* The old API that is unchanged (except for incompatibilities noted) and
  performs the instrumentation using babel as a library.

* A `programVisitor` object for the Babel AST can be used by a Babel plugin
  to emit instrumentation for ES6 code directly without any source map
  processing. This is the preferred path for babel users. The Babel plugin is
  called `babel-istanbul-instrument`.

Incompatibilities and changes to instrumentation behavior can be found in
[v0-changes.md](v0-changes.md).


