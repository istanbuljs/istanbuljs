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

	var isEntry = true;

	function wrapCustomHook(hook) {
		return function (module, originalFilename) {
			var wasEntry = isEntry;
			isEntry = false;

			var originalCompile = module._compile;

			var code;
			var filename;

			module._compile = function replacementCompile(_code, _filename) {
				code = _code;
				filename = _filename;
				module._compile = originalCompile;
				if (!wasEntry) {
					module._compile(code, filename);
				}
			};

			hook(module, originalFilename);

			if (wasEntry) {
				isEntry = true;
				listener(module, code, filename);
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
			forwardSet(hook);
		}
	}

	Object.defineProperty(extensions, ext, {
		configurable: true,
		enumerable: true,
		get: forwardGet,
		set: setCurrentHook
	});
}
