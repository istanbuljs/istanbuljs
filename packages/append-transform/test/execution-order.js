import test from 'ava';
import MockSystem from './_mock-module-system';

// Transform that just appends some text
function append(message) {
	return code => code + ' ' + message;
}

test.beforeEach(t => {
	t.context = new MockSystem({
		'/foo.js': 'foo'
	});
});

test('conventional transforms are applied in the order installed', t => {
	const system = t.context;
	system.installConventionalTransform(append('a'));
	system.installConventionalTransform(append('b'));
	const module = system.load('/foo.js');

	t.is(module.code, 'foo a b');
});

test('wrapped transforms are applied last, even when conventional transforms are added later', t => {
	const system = t.context;
	system.appendTransform(append('always-last'));
	system.installConventionalTransform((append('b')));
	const module = system.load('/foo.js');

	t.is(module.code, 'foo b always-last');
});

test('wrapped transforms get applied after the conventional transforms they replace', t => {
	const system = t.context;
	system.installConventionalTransform(append('a'));
	system.appendTransform(append('b'));
	const module = system.load('/foo.js');

	t.is(module.code, 'foo a b');
});

test('multiple wrapped transforms can be installed on top of each other, they are applied in reverse order (first installed is applied last)', t => {
	const system = t.context;
	system.appendTransform(append('a'));
	system.appendTransform(append('b'));
	const module = system.load('/foo.js');

	t.is(module.code, 'foo b a');
});
