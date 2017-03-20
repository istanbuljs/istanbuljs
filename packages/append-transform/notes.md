## Babel 5

.js / .es6 / .es / .jsx

```js
var istanbulLoader = function istanbulLoader(m, filename, old) {
  istanbulMonkey[filename] = true;
  old(m, filename);
};

var normalLoader = function normalLoader(m, filename) {
  m._compile(compile(filename), filename);
};

var old = oldHandlers[ext] || oldHandlers[".js"] || require.extensions[".js"];

var loader = normalLoader;
if (process.env.running_under_istanbul) loader = istanbulLoader;

require.extensions[ext] = function (m, filename) {
  if (shouldIgnore(filename)) {
    old(m, filename);
  }
   else {
    loader(m, filename, old);
  }
}
```

## CoffeeScript

.coffee / .litcoffee / .coffee.md

```js
coffee = function (module, filename) {
  var answer;
  answer = CoffeeScript._compileFile(filename, false);
  return module._compile(answer, filename);
}
```

## Default Extension Implementations

.js:

```js
js = function (module, filename) {
  var content = fs.readFileSync(filename, 'utf8');
  module._compile(internalModule.stripBOM(content), filename);
}
```

.json:

```js
json = function (module, filename) {
  var content = fs.readFileSync(filename, 'utf8');

  try {
    module.exports = JSON.parse(internalModule.stripBOM(content));
  } catch (err) {
    err.message = filename + ': ' + err.message;
    throw err;
  }
}
```

.node:

```js
node = function (module, filename) {
  return process.dlopen(module, path._makeLong(filename));
}
```

