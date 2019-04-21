# nyc-config-hook-run-in-this-context

Handy configuration for instrumenting with hook-run-in-this-context enabled.

Prior to node.js 11.11.0 `require()` was implemented using `vm.runInThisContext()`.
This meant that running with `hook-run-in-this-context` enabled required disabling
`hook-require`. Starting with node 11.11.0 `require()` is no longer implemented
with `vm.runInThisContext()`, so `hook-require` still needs to be enabled. This
base configuration enables `hook-run-in-this-context` and provides the correct
setting for `hook-require` to ensure that modules loaded by `require()` are
instrumented once.

First install the dependencies:

`npm i nyc @istanbuljs/nyc-config-hook-run-in-this-context --save-dev`

## .nycrc

And write a `.nycrc` that looks like this:

```json
{
    "extends": "@istanbuljs/nyc-config-hook-run-in-this-context"
    /* add custom settings */
}
```

## License

ISC
