'use strict';

module.exports = wrapExtension;

function wrapExtension(listener, ext, extensions) {
	ext = ext || '.js';
	extensions = extensions || require.extensions;

	var forwardGet;
	var forwardSet;

	var descriptor = Object.getOwnPropertyDescriptor(extensions, ext);

	if (
		((descriptor.get || descriptor.set) && !(descriptor.get && descriptor.set)) ||
		!descriptor.configurable
	) {
		throw new Error('Somebody did bad things to require.extensions["' + ext + '"]');
	}

	if (descriptor.get) {
		forwardGet = function () {
			return descriptor.get();
		};
		forwardSet = function (val) {
			descriptor.set(val);
			return forwardGet();
		};
	} else {
		forwardGet = function () {
			return descriptor.value;
		};
		forwardSet = function (val) {
			descriptor.value = val;
			return val;
		};
	}

	var stack = null;

	function wrapCustomHook(hook) {
		return function (module, originalFilename) {
			var hasStack = stack;

			if (!hasStack) {
				stack = [];
			}

			var originalCompile = module._compile;

			var entry = {
				module: module,
				compile: originalCompile,
				originalFilename: originalFilename
			};

			module._compile = function replacementCompile(code, filename) {
				entry.code = code;
				entry.filename = filename;
				if (hasStack) {
					originalCompile.call(module, code, filename);
				}
			};

			hook(module, originalFilename);

			stack.push(entry);

			if (!hasStack) {
				var finalEntry = stack[stack.length - 1];
				var tempStack = stack;

				stack = null;

				listener(finalEntry, tempStack);
			}
		};
	}

	// wrap the original
	forwardSet(wrapCustomHook(forwardGet()));

	var hooks = [forwardGet()];

	function setCurrentHook(hook) {
		var restoreIndex = hooks.indexOf(hook);
		if (restoreIndex === -1) {
			hooks.push(forwardSet(wrapCustomHook(hook)));
		} else {
			hooks.splice(restoreIndex + 1, hooks.length);
		}
	}

	Object.defineProperty(extensions, ext, {
		configurable: true,
		enumerable: true,
		get: forwardGet,
		set: setCurrentHook
	});
}
