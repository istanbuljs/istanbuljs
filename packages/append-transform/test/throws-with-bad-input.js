import test from 'ava';
import wrapExtension from '../';

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
