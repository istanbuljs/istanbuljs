import test from 'ava';
import MockSystem from './_mock-module-system';

// Simple Test Transforms
const toUpperCase = code => code.toUpperCase();
const fooToBar = code => code.replace(/foo/i, 'bar');

test('conventional transforms are applied in the order installed', t => {
	const system = new MockSystem({
		'/foo.js': 'console.log("foo");'
	});

	system.installConventionalTransform(toUpperCase);

	system.installConventionalTransform(fooToBar);

	const module = system.load('/foo.js');

	t.is(module.code, 'CONSOLE.LOG("bar");');
});

test('wrapped transforms are applied last, even when conventional transforms are added later', t => {
	const system = new MockSystem({
		'/foo.js': 'console.log("foo");'
	});

	system.installWrappedTransform(toUpperCase);

	system.installConventionalTransform(fooToBar);

	const module = system.load('/foo.js');

	t.is(module.code, 'CONSOLE.LOG("BAR");');
});

test('wrapped transforms get applied after the conventional transforms they replace', t => {
	const system = new MockSystem({
		'/foo.js': 'console.log("foo");'
	});

	system.installConventionalTransform(fooToBar);

	system.installWrappedTransform(toUpperCase);

	const module = system.load('/foo.js');

	t.is(module.code, 'CONSOLE.LOG("BAR");');
});

test('multiple wrapped transforms can be installed on top of each other, they are applied in reverse order (first installed is applied last)', t => {
	const system = new MockSystem({
		'/foo.js': 'console.log("foo");'
	});

	system.installWrappedTransform(fooToBar);

	system.installWrappedTransform(toUpperCase);

	const module = system.load('/foo.js');

	t.is(module.code, 'CONSOLE.LOG("bar");');
});
