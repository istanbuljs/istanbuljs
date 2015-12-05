'use strict';

module.exports = wrapExtension;

function wrapExtension(ext, log, extensions) {
	log = log || function () {};
	extensions = extensions || require.extensions;

	var forwardSet = Object.getOwnPropertyDescriptor(extensions, ext).set;

	var nextId = 1;

	// the original
	var requireHook = wrapCustomHook(extensions[ext], 'default');

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

	var hooks = [requireHook];

	function getCurrentHook() {
		return requireHook;
	}

	function setCurrentHook(hook) {
		var restoreIndex = hooks.indexOf(hook);
		if (restoreIndex !== -1) {
			requireHook = hook;
			hooks.splice(restoreIndex + 1, hooks.length);
			log('rolled back to ' + requireHook.hookId);
		} else {
			var id = nextId;
			nextId ++;
			requireHook = wrapCustomHook(hook, id);
			hooks.push(requireHook);
			log('installed new hook ' + id);
		}
		if (forwardSet) {
			forwardSet(requireHook);
		}
	}

	Object.defineProperty(extensions, ext, {
		configurable: true,
		enumerable: true,
		get: getCurrentHook,
		set: setCurrentHook
	});
}
