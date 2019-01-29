# nyc-config-typescript

Handy default configuration for instrumenting your babel-backed
project with test coverage using [nyc](https://github.com/istanbuljs/nyc).

First install the dependencies:

`npm i nyc source-map-support ts-node @istanbuljs/nyc-config-typescript --save-dev`

Then write a `tsconfig.json` that looks something like this:

## tsconfig.json

```json
{
  "sourceMap": "inline",
  // OR
  "sourceMap": true
}
```

## .nycrc

And write a `.nycrc` that looks like this:

```json
{
  "extends": "@istanbuljs/nyc-config-typescript",
  // OPTIONAL if you want coverage reported on every file, including those that aren't tested:
  "all": true
}
```

## Running Tests

If you're using `mocha`:

### test/mocha.opts

```
--require ts-node/register #replace with ts-node/register/transpile-only if you have custom types
--require source-map-support/register
--recursive
<glob for your test files>
```

Now setup the test scripts in your package.json like so (with the equivalent for your test runner):

```json
{
  "test": "nyc mocha"
}
```

## License

ISC
