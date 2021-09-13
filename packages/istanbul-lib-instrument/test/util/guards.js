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

function isYieldAvailable() {
    return tryThis('function *foo() { yield 1; }', 'yield');
}

function isClassPropAvailable() {
    return tryThis('class Foo { a = 1; }', 'class property');
}

function isClassPrivatePropAvailable() {
    return tryThis('class Foo { #a = 1; }', 'class private property');
}

function isForOfAvailable() {
    return tryThis(
        'function *foo() { yield 1; }\n' + 'for (var k of foo()) {}',
        'for-of'
    );
}

function isArrowFnAvailable() {
    return tryThis('[1 ,2, 3].map(x => x * x)', 'arrow function');
}

function isObjectSpreadAvailable() {
    return tryThis('const a = {...{b: 33}}', 'object-spread');
}

function isObjectFreezeAvailable() {
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

function isOptionalCatchBindingAvailable() {
    return tryThis('try {} catch {}');
}

function isImportAvailable() {
    return tryThis('import fs from "fs"', 'import', true);
}

function isExportAvailable() {
    return tryThis('export default function foo() {}', 'export', true);
}

function isDefaultArgsAvailable() {
    return tryThis('function foo(a=1) { return a + 1; }', 'default args');
}

function isInferredFunctionNameAvailable() {
    return tryThis(
        'const foo = function () {}; require("assert").equal(foo.name, "foo")'
    );
}

function isInferredClassNameAvailable() {
    return tryThis(
        'const foo = class {}; require("assert").equal(foo.name, "foo")'
    );
}

function isClassAvailable() {
    return tryThis("new Function('args', '{class Foo extends (Bar) {}}')");
}

module.exports = {
    isClassAvailable,
    isInferredClassNameAvailable,
    isInferredFunctionNameAvailable,
    isDefaultArgsAvailable,
    isExportAvailable,
    isImportAvailable,
    isOptionalCatchBindingAvailable,
    isObjectFreezeAvailable,
    isYieldAvailable,
    isClassPropAvailable,
    isClassPrivatePropAvailable,
    isForOfAvailable,
    isArrowFnAvailable,
    isObjectSpreadAvailable
};
