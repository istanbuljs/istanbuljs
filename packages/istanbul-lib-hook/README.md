# istanbul-lib-hook

[![Build Status](https://travis-ci.org/istanbuljs/istanbul-lib-hook.svg?branch=main)](https://travis-ci.org/istanbuljs/istanbul-lib-hook)

Hooks for require, vm and script used in istanbul

## API

### hookESM(matcher, transformer, opts)

Hooks Node.js module loading via `node:module` `registerHooks()` to synchronously transform ES module source loaded via `import` on Node.js 20+.

Important notes:

- Hooks must be registered **before** the modules you want to transform are loaded.
- Only `file:` URLs are eligible for transformation (builtins like `node:fs` are not transformed).
- CommonJS modules are deliberately skipped; use `hookRequire()` to transform `require()` loads.
