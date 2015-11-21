istanbul-lib-instrument
-----------------------

[![Build Status](https://travis-ci.org/istanbuljs/istanbul-lib-instrument.svg?branch=master)](https://travis-ci.org/istanbuljs/istanbul-lib-instrument)

Istanbul instrumenter and source maps processing library.

Backwards incompatibilities
----------------------------

* Function declarations and no-init variable declarations
* Ignores do not inject code
* No support for embedding code into coverage objects

TODO
----

* Change the interface signature to always return an object?
* Figure out skip counting and implement

