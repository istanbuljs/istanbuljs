# Changes from the v0 instrumenter

## Differences in instrumentation

* Function declarations and variable declarations are not treated as statements.
* However, each individual variable declaration that is also initialized becomes
  a statement that is tracked.
* Class methods and arrow functions now contribute to function coverage.
* Assignment expressions (i.e. default arguments assigned to function params)
  now count as a branch.
* `Ignore` now really means "do not instrument". Previously, ignore code would
  still generate coverage counters with additional metadata for reporting to
  ignore them. Now, nothing is injected when ignores are in effect; this fixes
  issues with people wanting to ignore functions and ship them over the wire
  to a different execution environment where the coverage variables are not
  defined. It also means that the HTML report will be unable to show how many
  statements/ functions/ branches were ignored.
* Internally uses `babel` rather than `esprima` and exports a new visitor
  that can be used by a babel plugin to instrument the ES6 code without
  having to instrument transpiled code and deal with source maps. This provides
  a "native" instrumentation option for Babel users.

## API changes

* `instrumenter.instrumentASTSync` is no longer supported. It was a bad idea to
  expose this in the first place. The AST is different (a Babel AST) now and this
  fact is now correctly hidden in the implementation of the API so that future
  changes to the AST is possible without affecting consumers.
* Instrumenter options:
  * `embedSource` no longer available. The original source is never packed in
     with the coverage object. This was causing all manner of special casing
     in the reporting code.
  * `noAutoWrap` becomes `autoWrap` (default `false`). Mainline `return` statements
    are no longer considered correct by default.
  * `codeGenerationOptions` is gone. This was specific to `escodegen` that is no
    longer used.
  * `walkDebug` option is gone now that babel does the AST walking
  * `produceSourceMap` boolean option added to produce a source map for the
    instrumented code. This is available using the `lastSourceMap` method
    on the instrumenter (as before, except that the mechanism to turn it on is
    direct and not a property passed down to `escodegen`)
  * `sourceMapUrlCallback` may be set to a function that accepts 2 arguments,
    the source file name and the source map URL found in it.

