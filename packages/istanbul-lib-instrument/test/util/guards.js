function tryThis(str, feature, generateOnly) {
    if (!generateOnly) {
        try {
            eval(str);
        } catch (ex) {
            console.error(
                'ES6 feature [' +
                    feature +
                    '] is not available in this environment'
            );
            return false;
        }
    }
    return true;
}

export function isYieldAvailable() {
    return tryThis('function *foo() { yield 1; }', 'yield');
}

export function isClassPropAvailable() {
    return tryThis('class Foo { a = 1; }', 'class property');
}

export function isClassPrivatePropAvailable() {
    return tryThis('class Foo { #a = 1; }', 'class private property');
}

export function isForOfAvailable() {
    return tryThis(
        'function *foo() { yield 1; }\n' + 'for (var k of foo()) {}',
        'for-of'
    );
}

export function isArrowFnAvailable() {
    return tryThis('[1 ,2, 3].map(x => x * x)', 'arrow function');
}

export function isObjectSpreadAvailable() {
    return tryThis('const a = {...{b: 33}}', 'object-spread');
}

export function isObjectFreezeAvailable() {
    if (!Object.freeze) {
        return false;
    }
    const foo = Object.freeze({});
    try {
        foo.bar = 1;
        return false;
    } catch (ex) {
        return true;
    }
}

export function isOptionalCatchBindingAvailable() {
    return tryThis('try {} catch {}');
}

export function isImportAvailable() {
    return tryThis('import fs from "fs"', 'import', true);
}

export function isExportAvailable() {
    return tryThis('export default function foo() {}', 'export', true);
}

export function isDefaultArgsAvailable() {
    return tryThis('function foo(a=1) { return a + 1; }', 'default args');
}

export function isInferredFunctionNameAvailable() {
    return tryThis(
        'const foo = function () {}; require("assert").equal(foo.name, "foo")'
    );
}

export function isInferredClassNameAvailable() {
    return tryThis(
        'const foo = class {}; require("assert").equal(foo.name, "foo")'
    );
}

export function isClassAvailable() {
    return tryThis("new Function('args', '{class Foo extends (Bar) {}}')");
}
