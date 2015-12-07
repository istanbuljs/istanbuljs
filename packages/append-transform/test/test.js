import test from 'ava';
import MockSystem from './_mock-module-system';
import wrapExtension from '../';
import fs from 'fs';

// Transform that just appends some text
function append(message) {
	return code => code + ' ' + message;
}

test.beforeEach(t => t.context = new MockSystem({
	'/foo.js': 'foo'
}));

test('installs a transform', t => {
	const system = t.context;
	system.installWrappedTransform(append('a'));
	const module = system.load('/foo.js');

	t.is(module.code, 'foo a');
});

test('replacing an extension that just forwards through to `old` without calling compile', t => {
	const system = t.context;

	const old = system.extensions['.js'];
	system.extensions['.js'] = function (module, filename) {
		old(module, filename);
	};

	system.installWrappedTransform(append('a'));
	system.installConventionalTransform(append('b'));
	system.installConventionalTransform(append('c'));

	const module = system.load('/foo.js');

	t.is(module.code, 'foo b c a');
});

test('immediately replaced by an extension that just forwards through to `old` without calling compile', t => {
	const system = t.context;

	system.installWrappedTransform(append('a'));

	const old = system.extensions['.js'];
	system.extensions['.js'] = function (module, filename) {
		old(module, filename);
	};

	system.installConventionalTransform(append('b'));
	system.installConventionalTransform(append('c'));

	const module = system.load('/foo.js');

	t.is(module.code, 'foo b c a');
});

test('extension that just forwards through to `old` without calling compile the middle of a chain', t => {
	const system = t.context;
	system.installWrappedTransform(append('a'));
	system.installConventionalTransform(append('b'));

	const old = system.extensions['.js'];
	system.extensions['.js'] = function (module, filename) {
		old(module, filename);
	};

	system.installConventionalTransform(append('c'));

	const module = system.load('/foo.js');

	t.is(module.code, 'foo b c a');
});

test('can install other than `.js` extensions', t => {
	const system = new MockSystem({
		'/foo.coffee': 'foo'
	});

	// No default extension exists for coffee - we need to add the first one manually.
	system.extensions['.coffee'] = function (module, filename) {
		let content = system.content[filename];
		content = filename + '(' + content + ')';
		module._compile(content, filename);
	};

	system.installConventionalTransform(append('a'), '.coffee');
	system.installWrappedTransform(append('b'), '.coffee');
	system.installConventionalTransform(append('c'), '.coffee');

	const module = system.load('/foo.coffee');

	t.is(module.code, '/foo.coffee(foo) a c b');
});

test('test actual require', t => {
	require.extensions['.foo'] = function (module, filename) {
		module._compile(fs.readFileSync(filename, 'utf8'), filename);
	};

	wrapExtension((module, code, filename) => {
		module._compile(code + ' + " bar"', filename);
	}, '.foo');

	t.is(require('./fixture/foo.foo'), 'foo bar');
});

test('accommodates reverting extension', t => {
	const system = t.context;

	system.installWrappedTransform(append('always-last'));
	system.installConventionalTransform(append('b'));
	const rollback = system.extensions['.js'];
	system.installConventionalTransform(append('c'));
	let module = system.load('/foo.js');

	t.is(module.code, 'foo b c always-last');

	system.extensions['.js'] = rollback;
	let module2 = system.load('/foo.js');

	t.is(module2.code, 'foo b always-last');
});
