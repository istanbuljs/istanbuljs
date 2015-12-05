'use strict';

module.exports = wrapExtension;

function wrapExtension(ext, log, extensions) {
	log = log || function () {};
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

	var nextId = 1;

	function wrapCustomHook(hook, id) {
		if (!id) {
			id = nextId;
			nextId++;
		}
		return function (module, originalFilename) {
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
	}

	// wrap the original
	forwardSet(wrapCustomHook(forwardGet(), 'default'));

	var hooks = [forwardGet()];

	function setCurrentHook(hook) {
		var restoreIndex = hooks.indexOf(hook);
		if (restoreIndex === -1) {
			hooks.push(forwardSet(wrapCustomHook(hook)));
			log('installed new hook');
		} else {
			hooks.splice(restoreIndex + 1, hooks.length);
			log('rolled back');
		}
	}

	Object.defineProperty(extensions, ext, {
		configurable: true,
		enumerable: true,
		get: forwardGet,
		set: setCurrentHook
	});
}
