import test from 'ava';
import wrapExtension from './';

function toCaps(extensions) {
	var originalExtension = extensions['.js'];

	extensions['.js'] = function (module, filename) {
		var originalCompile = module._compile;

		module._compile = (code, filename) => {
			code = code.toUpperCase();
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

	const content = {
		'/foo.js': 'console.log("foo");'
	};

	const module = {
		_compile (code, file) {
			module.code = code;
			module.file = file;
		}
	};

	t.context.module = module;
	t.context.logs = logs;
	t.context.logger = logger;
	t.context.content = content;

	// Default Extension, loads content from object hash instead of disk.
	t.context.extensions = {
		'.js'(module, filename) {
			module._compile(content[filename], filename);
		}
	};
});

test('toCaps', t => {
	t.plan(2);
	const c = t.context;

	function listener (entry, stack) {
		t.true(/CONSOLE\.LOG/.test(entry.code));

		entry.compile.call(entry.module, entry.code.replace(/FOO/, 'bar'), entry.filename);
	}

	wrapExtension(listener, '.js', c.extensions);

	toCaps(c.extensions);

	c.extensions['.js'](c.module, '/foo.js');

	t.is(c.module.code, 'CONSOLE.LOG("bar");');
});
