# append-transform [![Build Status](https://travis-ci.org/jamestalmage/append-transform.svg?branch=master)](https://travis-ci.org/jamestalmage/append-transform) [![Coverage Status](https://coveralls.io/repos/jamestalmage/append-transform/badge.svg?branch=master&service=github)](https://coveralls.io/github/jamestalmage/append-transform?branch=master)

> Install a transform to `require.extensions` that always runs last, even if additional extensions are added later.

The typical require extension looks something like this:

```js
  var myTransform = require('my-transform');
  
  var oldExtension = require.extensions['.js'];
  require.extensions['.js'] = function (module, filename) {
    var oldCompile = module._compile;
    module._compile = function (code, filename) {
      code = myTransform(code);
      module._compile = oldCompile;
      module._compile(code, filename);
    };  
    oldExtension(module, filename);
  };
```

In *almost* all cases, that is sufficient and is the method that should be used ([`pirates`](https://www.npmjs.com/package/pirates) makes it much easier to do this correctly).

In *rare* cases you must ensure your transform remains the last one, even if other transforms are added later. For example `nyc` uses this module to ensure its transform is applied last. This allows it to capture the final source-map information from the entire chain of transforms, and ensures any language extension transforms (`babel` for instance) are already applied before it attempts to instrument for coverage.


*WARNING:* You really should evaluate whether you *actually* need this. By using this you are taking control away from the user. Your transform remains the last one applied, and they have no option to reorder it. Coverage libraries like `nyc` (and `istanbul` on which it relies) have valid reasons for doing this, but you should prefer conventional transform installation via [`pirates`](https://www.npmjs.com/package/pirates) until you are sure you need this.

## Install

```
$ npm install --save append-transform
```


## Usage

```js
var appendTransform = require('append-transform');
var myTransform = require('my-transform');

appendTransform(function (code, filename) {
  if (myTransform.shouldTransform(filename)) {
    code = myTransform.transform(code);
  }
  return code;
});
```

## API

### appendTransform(transformFn, [extension])

#### transformFn

Type: `function(code: string, filename: string)`  
*Required*

A callback that modifies the incoming `code` argument in some way, and returns the transformed result. `filename` is provided to filter which files the transform applies to. If a transform should not manipulate a particular file, just return `code` without modifying it. It is fairly common to avoid transforming files in `node_modules`. In that case you may want to use [`node-modules-regexp`](https://www.npmjs.com/package/node-modules-regexp) to help reliably detect `node_modules` paths and avoid transforming them.


#### extension

Type: `string`  
Default: `".js"`

The file extension this transform should be applied to.

## License

MIT © [James Talmage](http://github.com/jamestalmage)
