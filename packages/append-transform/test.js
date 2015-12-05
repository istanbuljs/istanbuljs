import test from 'ava';
import wrapExtension from './';

function deadEnd(extensions, id) {
	extensions['.js'] = function (module, filename) {
		module._compile('deadEnd-' + id + '-' + filename, filename);
	};
}

function preprocessor(extensions, id) {
	var originalExtension = extensions['.js'];

	extensions['.js'] = function (module, filename) {
		var originalCompile = module._compile;

		module._compile = (code, filename) => {
			code = code + ':preprocessor-' + id + '-' + filename;
			originalCompile(code, filename);
		};

		originalExtension(module, filename);
	};
}

test.beforeEach(t => {
	const logs = [];

	function logger() {
		logs.push(Array.prototype.slice.call(arguments));
	}

	const module = {
		_compile (code, file) {
			module.code = code;
			module.file = file;
			logger('raw _compile')
		}
	};

	t.context.module = module;
	t.context.logs = logs;
	t.context.logger = logger;

	t.context.extensions = {
		'.js'(module, filename) {
			module._compile('raw:' + filename, filename);
		}
	};
});

test.serial('deadEnd\n\n', t => {
	const {logs, logger, module, extensions} = t.context;

	wrapExtension('.js', logger, extensions);

	deadEnd(extensions, 'a');

	extensions['.js'](module, 'foo.js');

	console.log(module);
	console.log(logs);
});


test.serial('preprocessor\n\n', t => {
	const {logs, logger, module, extensions} = t.context;

	wrapExtension('.js', logger, extensions);

	preprocessor(extensions, 'a');

	extensions['.js'](module, 'foo.js');

	console.log(module);
	console.log(logs);
});
