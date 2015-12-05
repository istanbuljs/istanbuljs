import test from 'ava';
import MockSystem from './_mock-module-system';
import wrapExtension from '../';

// Simple Test Transforms
const toUpperCase = code => code.toUpperCase();
const fooToBar = code => code.replace(/foo/i, 'bar');
const addHeader = code => '// header\n' + code;
const addFooter = code => code + '\n// footer';

test('installs a transform', t => {
	const system = new MockSystem({
		'/foo.js': 'console.log("foo");'
	});

	system.installWrappedTransform(fooToBar);

	const module = system.load('/foo.js');

	t.is(module.code, 'console.log("bar");');
});

test('can install other than `.js` extensions', t => {
	const system = new MockSystem({
		'/foo.coffee': 'foo'
	});

	system.extensions['.coffee'] = function (module, filename) {
		let content = system.content[filename];
		content = 'coffee(' + content + ')';
		module._compile(content, filename);
	};

	system.installWrappedTransform(toUpperCase, '.coffee');

	const module = system.load('/foo.coffee');

	t.is(module.code, 'COFFEE(FOO)');
});

test('test actual require', t => {
	require.extensions['.foo'] = function (module, filename) {
		module._compile('module.exports = "foo";', filename);
	};

	wrapExtension((module, code, filename) => {
		module._compile(fooToBar(code), filename);
	}, '.foo');

	t.is(require('./fixture/foo.foo'), 'bar');
});

test('handles uninstall cleanly', t => {
	const system = new MockSystem({
		'/foo.js': 'console.log("foo");'
	});

	system.installWrappedTransform(fooToBar);
	system.installConventionalTransform(addHeader);
	const headerOnly = system.extensions['.js'];
	system.installConventionalTransform(addFooter);

	let module = system.load('/foo.js');

	t.is(module.code, '// header\nconsole.log("bar");\n// footer');

	system.extensions['.js'] = headerOnly;

	let module2 = system.load('/foo.js');

	t.is(module2.code, '// header\nconsole.log("bar");');
});

test('throws if getter but no setter', t => {
	var extensions = {
		get '.js'() {
			return () => t.fail();
		}
	};

	t.throws(
		() => wrapExtension(() => t.fail(), '.js', extensions),
		'Somebody did bad things to require.extensions[".js"]'
	);
});

test('throws if setter but no getter', t => {
	var extensions = { // eslint-disable-line accessor-pairs
		set '.js'(foo) {
			t.fail();
		}
	};

	t.throws(
		() => wrapExtension(() => t.fail(), '.js', extensions),
		'Somebody did bad things to require.extensions[".js"]'
	);
});

test('throws if not configurable', t => {
	var extensions = {};

	Object.defineProperty(extensions, '.js', {
		value: () => t.fail(),
		configurable: false
	});

	t.throws(
		() => wrapExtension(() => t.fail(), '.js', extensions),
		'Somebody did bad things to require.extensions[".js"]'
	);
});
