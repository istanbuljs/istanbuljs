import test from 'ava';
import appendTransform from '../';

test('throws if getter but no setter', t => {
	var extensions = {
		get '.js'() {
			return () => t.fail();
		}
	};

	t.throws(
		() => appendTransform(() => t.fail(), '.js', extensions),
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
		() => appendTransform(() => t.fail(), '.js', extensions),
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
		() => appendTransform(() => t.fail(), '.js', extensions),
		'Somebody did bad things to require.extensions[".js"]'
	);
});
