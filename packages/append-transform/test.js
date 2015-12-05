import test from 'ava';
import wrapExtension from './';
import path from 'path';

function toCaps(c) {
	var originalExtension = c.extensions['.js'];

	c.extensions['.js'] = function (module, filename) {
		var originalCompile = module._compile;

		module._compile = (code, filename) => {
			code = code.toUpperCase();
			originalCompile(code, filename);
		};

		originalExtension(module, filename);
	};
}

function header(c) {
	var originalExtension = c.extensions['.js'];

	c.extensions['.js'] = function (module, filename) {
		var originalCompile = module._compile;

		module._compile = (code, filename) => {
			originalCompile('// header\n' + code, filename);
		};

		originalExtension(module, filename);
	};
}

function alternate(c, predicate) {
	var originalExtension = c.extensions['.js'];

	c.extensions['.js'] = function (module, filename) {
		if (predicate(filename)) {
			const code = c.content['/alternate' + filename];
			module._compile(code, filename);
		} else {
			originalExtension(module, filename);
		}
	};
}

function fooToBar(entry) {
	entry.compile.call(entry.module, entry.code.replace(/foo/i, 'bar'), entry.filename);
}

function footer(entry) {
	entry.compile.call(entry.module, entry.code + '\n// footer', entry.filename);
}

function installListener(fn, c) {
	wrapExtension(function (entry) {
		c.logger(fn.name, entry.code, entry.filename);
		fn.apply(null, arguments);
	}, '.js', c.extensions);
}

class MockModule {
	_compile (code, file) {
		this.code = code;
		this.file = file;
	}
}

test.beforeEach(t => {
	const logs = [];
	function logger() {
		logs.push(Array.prototype.slice.call(arguments));
	}

	const content = {
		'/foo.js': 'console.log("foo");',
		'/baz.js': 'baz.foo();',
		'/alternate/foo.js': 'console.log("alternate-foo");',
		'/alternate/baz.js': 'bazAlt.foo();'
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

	t.context.load = filename => {
		const module = new MockModule();
		var extension = path.extname(filename);
    t.context.extensions[extension](module, filename);
		return module;
	}
});

test('fooToBar: toCaps', t => {
	const c = t.context;

	installListener(fooToBar, c);

	toCaps(c);

	const module = c.load('/foo.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'CONSOLE.LOG("FOO");',
				'/foo.js'
			]
		]
	);

	t.is(module.code, 'CONSOLE.LOG("bar");');
});

test('fooToBar: header', t => {
	const c = t.context;

	installListener(fooToBar, c);

	header(c);

	const module = c.load('/foo.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'// header\nconsole.log("foo");',
				'/foo.js'
			]
		]
	);

	t.is(module.code, '// header\nconsole.log("bar");');
});

test('fooToBar: header + toCaps', t => {
	const c = t.context;

	installListener(fooToBar, c);

	header(c);
	toCaps(c);

	const module = c.load('/foo.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'// HEADER\nCONSOLE.LOG("FOO");',
				'/foo.js'
			]
		]
	);

	t.is(module.code, '// HEADER\nCONSOLE.LOG("bar");');
});

test('fooToBar: toCaps + header', t => {
	const c = t.context;

	installListener(fooToBar, c);

	toCaps(c);
	header(c);

	const module = c.load('/foo.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'// header\nCONSOLE.LOG("FOO");',
				'/foo.js'
			]
		]
	);

	t.is(module.code, '// header\nCONSOLE.LOG("bar");');
});

test('footer: header', t => {
	const c = t.context;

	installListener(footer, c);

	header(c);

	const module = c.load('/foo.js');

	t.same(c.logs,
		[
			[
				'footer',
				'// header\nconsole.log("foo");',
				'/foo.js'
			]
		]
	);

	t.is(module.code, '// header\nconsole.log("foo");\n// footer');
});

test('footer + fooToBar: header', t => {
	const c = t.context;

	installListener(footer, c);
	installListener(fooToBar, c);

	header(c);

	const module = c.load('/foo.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'// header\nconsole.log("foo");',
				'/foo.js'
			],
			[
				'footer',
				'// header\nconsole.log("bar");',
				'/foo.js'
			]
		]
	);

	t.is(module.code, '// header\nconsole.log("bar");\n// footer');
});

test('footer + fooToBar: alternate(false)', t => {
	const c = t.context;

	installListener(footer, c);
	installListener(fooToBar, c);

	alternate(c, () => false);

	const module = c.load('/baz.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'baz.foo();',
				'/baz.js'
			],
			[
				'footer',
				'baz.bar();',
				'/baz.js'
			]
		]
	);

	t.is(module.code, 'baz.bar();\n// footer');
});

test('footer + fooToBar: --no other extensions--', t => {
	const c = t.context;

	installListener(footer, c);
	installListener(fooToBar, c);

	const module = c.load('/baz.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'baz.foo();',
				'/baz.js'
			],
			[
				'footer',
				'baz.bar();',
				'/baz.js'
			]
		]
	);

	t.is(module.code, 'baz.bar();\n// footer');
});

test('footer + fooToBar: alternate(true)', t => {
	const c = t.context;

	installListener(footer, c);
	installListener(fooToBar, c);

	alternate(c, () => true);

	const module = c.load('/baz.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'bazAlt.foo();',
				'/baz.js'
			],
			[
				'footer',
				'bazAlt.bar();',
				'/baz.js'
			]
		]
	);

	t.is(module.code, 'bazAlt.bar();\n// footer');
});


// The next three tests are nearly identical. The only difference is that position of `alternate`
// `alternate(true)` does not call "originalExtension".
// This shows installing a listener with this tool allows you to intercept extensions that do not call the previous one.
test('footer + fooToBar: alternate(true) + header', t => {
	const c = t.context;

	installListener(footer, c);
	installListener(fooToBar, c);
	alternate(c, () => true);
	header(c);

	const module = c.load('/baz.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'// header\nbazAlt.foo();',
				'/baz.js'
			],
			[
				'footer',
				'// header\nbazAlt.bar();',
				'/baz.js'
			]
		]
	);

	t.is(module.code, '// header\nbazAlt.bar();\n// footer');
});

test('footer: alternate(true) -> fooToBar:  header', t => {
	const c = t.context;

	installListener(footer, c);
	alternate(c, () => true);
	installListener(fooToBar, c);
	header(c);

	const module = c.load('/baz.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'// header\nbazAlt.foo();',
				'/baz.js'
			],
			[
				'footer',
				'// header\nbazAlt.bar();',
				'/baz.js'
			]
		]
	);

	t.is(module.code, '// header\nbazAlt.bar();\n// footer');
});

test('footer: alternate(true) -> fooToBar:  header', t => {
	const c = t.context;

	alternate(c, () => true);
	installListener(footer, c);
	installListener(fooToBar, c);
	header(c);

	const module = c.load('/baz.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'// header\nbazAlt.foo();',
				'/baz.js'
			],
			[
				'footer',
				'// header\nbazAlt.bar();',
				'/baz.js'
			]
		]
	);

	t.is(module.code, '// header\nbazAlt.bar();\n// footer');
});

// This test shows that the `header` extension (which installs itself conventionally),
// has no affect on the final output. This is because `alternate(true)` does not defer to it.
// It simply demonstrates the problem this tool solves
// (intercepting extensions that do not explicitly defer to the one they replace).
test('footer: alternate(true) -> fooToBar:  header', t => {
	const c = t.context;

	installListener(footer, c);
	installListener(fooToBar, c);
	header(c);
	alternate(c, () => true);

	const module = c.load('/baz.js');

	t.same(c.logs,
		[
			[
				'fooToBar',
				'bazAlt.foo();',
				'/baz.js'
			],
			[
				'footer',
				'bazAlt.bar();',
				'/baz.js'
			]
		]
	);

	t.is(module.code, 'bazAlt.bar();\n// footer');
});
