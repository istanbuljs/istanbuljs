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

function header(extensions) {
	var originalExtension = extensions['.js'];

	extensions['.js'] = function (module, filename) {
		var originalCompile = module._compile;

		module._compile = (code, filename) => {
			originalCompile('// header\n' + code, filename);
		};

		originalExtension(module, filename);
	};
}

function fooToBar(entry) {
	entry.compile.call(entry.module, entry.code.replace(/foo/i, 'bar'), entry.filename);
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
	const c = t.context;

	wrapExtension(fooToBar, '.js', c.extensions);

	toCaps(c.extensions);

	c.extensions['.js'](c.module, '/foo.js');

	t.is(c.module.code, 'CONSOLE.LOG("bar");');
});

test('header', t => {
	const c = t.context;

	wrapExtension(fooToBar, '.js', c.extensions);

	header(c.extensions);

	c.extensions['.js'](c.module, '/foo.js');

	t.is(c.module.code, '// header\nconsole.log("bar");');
});

test('header + toCaps', t => {
	const c = t.context;

	wrapExtension(fooToBar, '.js', c.extensions);

	header(c.extensions);
	toCaps(c.extensions);

	c.extensions['.js'](c.module, '/foo.js');

	t.is(c.module.code, '// HEADER\nCONSOLE.LOG("bar");');
});

test('toCaps + header', t => {
	const c = t.context;

	wrapExtension(fooToBar, '.js', c.extensions);

	toCaps(c.extensions);
	header(c.extensions);

	c.extensions['.js'](c.module, '/foo.js');

	t.is(c.module.code, '// header\nCONSOLE.LOG("bar");');
});
