import test from 'ava';
import MockSystem from './_mock-module-system';
import appendTransform from '../';
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
	system.appendTransform(append('a'));
	const module = system.load('/foo.js');

	t.is(module.code, 'foo a');
});

test('replacing an extension that just forwards through to `old` without calling compile', t => {
	const system = t.context;

	const old = system.extensions['.js'];
	system.extensions['.js'] = function (module, filename) {
		old(module, filename);
	};

	system.appendTransform(append('a'));
	system.installConventionalTransform(append('b'));
	system.installConventionalTransform(append('c'));

	const module = system.load('/foo.js');

	t.is(module.code, 'foo b c a');
});

test('immediately replaced by an extension that just forwards through to `old` without calling compile', t => {
	const system = t.context;

	system.appendTransform(append('a'));

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
	system.appendTransform(append('a'));
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
	system.appendTransform(append('b'), '.coffee');
	system.installConventionalTransform(append('c'), '.coffee');

	const module = system.load('/foo.coffee');

	t.is(module.code, '/foo.coffee(foo) a c b');
});

test('test actual require', t => {
	require.extensions['.foo'] = function (module, filename) {
		module._compile(fs.readFileSync(filename, 'utf8'), filename);
	};

	appendTransform(code => code + ' + " bar"', '.foo');

	t.is(require('./fixture/foo.foo'), 'foo bar');
});

test('accommodates a future extension that adds, then reverts itself', t => {
	const system = t.context;

	system.appendTransform(append('always-last'));
	system.installConventionalTransform(append('b'));
	const rollback = system.extensions['.js'];
	system.installConventionalTransform(append('c'));
	let module = system.load('/foo.js');

	t.is(module.code, 'foo b c always-last');

	system.extensions['.js'] = rollback;
	delete system.cache['/foo.js'];
	let module2 = system.load('/foo.js');

	t.is(module2.code, 'foo b always-last');
});

test('handles nested requires', t => {
	const system = new MockSystem({
		'/foo.js': 'require("/bar.js");',
		'/bar.js': 'require("/baz.js");',
		'/baz.js': 'require("/foo.js");'
	});

	system.appendTransform(append('z'));
	system.installConventionalTransform(append('a'));
	system.appendTransform(append('x'));
	system.installConventionalTransform(append('b'));

	const foo = system.load('/foo.js');

	t.is(foo.code, 'require("/bar.js"); a b x z');
	t.is(foo.required['/bar.js'].code, 'require("/baz.js"); a b x z');
});
