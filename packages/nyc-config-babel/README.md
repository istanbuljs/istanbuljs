# nyc-config-babel

Handy default configuration for instrumenting your babel-backed
project with test coverage using [nyc](https://github.com/istanbuljs/nyc) and
[babel-plugin-istanbul](https://github.com/istanbuljs/babel-plugin-istanbul).

First install the dependencies:

`npm i babel-plugin-istanbul @istanbuljs/nyc-config-babel --save-dev`

Then write a `.babelrc` that looks something like this:

## .babelrc

```json
{
    "presets": ["@babel/env", "..., etc."],
    "plugins": ["istanbul"]
}
```

## .nycrc

And write a `.nycrc` that looks something like this:

```json
{
    "extends": "@istanbuljs/nyc-config-babel"
}
```

## Running Tests

Now setup the test scripts in your package.json like so:

```json
{
    "test": "nyc mocha test.js"
}
```

## License

ISC
