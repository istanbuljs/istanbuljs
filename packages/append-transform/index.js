'use strict';

module.exports = wrapExtension;

function wrapExtension(ext, log, extensions) {
	log = log || function () {};
	extensions = extensions || require.extensions;

	var descriptor = Object.getOwnPropertyDescriptor(extensions, ext);

	var __requireHook;
	if (!descriptor.get) {
		__requireHook = descriptor.value;
	}

	function forwardGet() {
		return descriptor.get ? descriptor.get() : __requireHook;
	}

	function forwardSet(val) {
		if (descriptor.set) {
			descriptor.set(val);
		} else {
			__requireHook = val;
		}
		return forwardGet();
	}

	var nextId = 1;

	// the original
	forwardSet(wrapCustomHook(forwardGet(), 'default'));

	function wrapCustomHook (hook, id) {
		var wrapped = function (module, originalFilename) {
			var originalCompile = module._compile;

			module._compile = function (transpiled, filename) {
				log(id + ' _compile called');
				module._compile = originalCompile;
				var ret = module._compile(transpiled, filename);
				log(id + ' _compile done');
				return ret;
			};

			log('entering ' + id);
			hook(module, originalFilename);
			log('exiting ' + id);
		};

		wrapped.hookId = id;

		return wrapped;
	}

	var hooks = [forwardGet()];

	function setCurrentHook(hook) {
		var restoreIndex = hooks.indexOf(hook);
		if (restoreIndex !== -1) {
			log('rolled back to ' + forwardSet(hook).hookId);
			hooks.splice(restoreIndex + 1, hooks.length);
		} else {
			var id = nextId;
			nextId ++;
			hooks.push(forwardSet(wrapCustomHook(hook, id)));
			log('installed new hook ' + id);
		}
	}

	Object.defineProperty(extensions, ext, {
		configurable: true,
		enumerable: true,
		get: forwardGet,
		set: setCurrentHook
	});
}
