# createInstrumenter

createInstrumenter creates a new instrumenter with the
supplied options.

**Parameters**

-   `opts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** instrumenter options. See the documentation
    for the Instrumenter class.

# Instrumenter

Instrumenter is the public API for the instrument library.
It is typically used for ES5 code. For ES6 code that you
are already running under `babel` use the coverage plugin
instead.

**Parameters**

-   `opts` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** optional.
    -   `opts.coverageVariable` **\[[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** name of global coverage variable. (optional, default `__coverage__`)
    -   `opts.preserveComments` **\[[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** preserve comments in output (optional, default `false`)
    -   `opts.compact` **\[[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** generate compact code. (optional, default `true`)
    -   `opts.esModules` **\[[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** set to true to instrument ES6 modules. (optional, default `false`)
    -   `opts.autoWrap` **\[[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** set to true to allow `return` statements outside of functions. (optional, default `false`)
    -   `opts.produceSourceMap` **\[[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** set to true to produce a source map for the instrumented code. (optional, default `false`)
    -   `opts.sourceMapUrlCallback` **\[[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)]** a callback function that is called when a source map URL
            is found in the original code. This function is called with the source file name and the source map URL. (optional, default `null`)
    -   `opts.debug` **\[[boolean](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Boolean)]** turn debugging on (optional, default `false`)

## instrumentSync

instrument the supplied code and track coverage against the supplied
filename. It throws if invalid code is passed to it. ES5 and ES6 syntax
is supported. To instrument ES6 modules, make sure that you set the
`esModules` property to `true` when creating the instrumenter.

**Parameters**

-   `code` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the code to instrument
-   `filename` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the filename against which to track coverage.
-   `inputSourceMap` **\[[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** the source map that maps the not instrumented code back to it's original form.
    Is assigned to the coverage object and therefore, is available in the json output and can be used to remap the
    coverage to the untranspiled source.

Returns **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the instrumented code.

## instrument

callback-style instrument method that calls back with an error
as opposed to throwing one. Note that in the current implementation,
the callback will be called in the same process tick and is not asynchronous.

**Parameters**

-   `code` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the code to instrument
-   `filename` **[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)** the filename against which to track coverage.
-   `callback` **[Function](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Statements/function)** the callback
-   `inputSourceMap` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the source map that maps the not instrumented code back to it's original form.
    Is assigned to the coverage object and therefore, is available in the json output and can be used to remap the
    coverage to the untranspiled source.

## lastFileCoverage

returns the file coverage object for the last file instrumented.

Returns **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** the file coverage object.

## lastSourceMap

returns the source map produced for the last file instrumented.

Returns **(null | [Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object))** the source map object.

# programVisitor

programVisitor is a `babel` adaptor for instrumentation.
It returns an object with two methods `enter` and `exit`.
These should be assigned to or called from `Program` entry and exit functions
in a babel visitor.
These functions do not make assumptions about the state set by Babel and thus
can be used in a context other than a Babel plugin.

The exit function returns an object that currently has the following keys:

`fileCoverage` - the file coverage object created for the source file.
`sourceMappingURL` - any source mapping URL found when processing the file.

**Parameters**

-   `types` **[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)** an instance of babel-types
-   `sourceFilePath` **\[[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)](default 'unknown.js')** the path to source file
-   `opts` **\[[Object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)](default {coverageVariable: '\_\_coverage\_\_', inputSourceMap: undefined })** additional options
    -   `opts.coverageVariable` **\[[string](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String)]** the global coverage variable name. (optional, default `__coverage__`)
    -   `opts.inputSourceMap` **\[[object](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object)]** the input source map, that maps the uninstrumented code back to the
        original code. (optional, default `undefined`)
