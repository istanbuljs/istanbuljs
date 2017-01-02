function tryThis(str, feature, generateOnly) {
    if (!generateOnly) {
        try {
            /*jshint evil: true */
            eval(str);
        } catch (ex) {
            console.error('ES6 feature [' + feature + '] is not available in this environment');
            return false;
        }
    }
    return true;
}

export function isYieldAvailable() {
    return tryThis('function *foo() { yield 1; }', 'yield');
}

export function isForOfAvailable() {
    return tryThis('function *foo() { yield 1; }\n' +
        'for (var k of foo()) {}', 'for-of');
}

export function isArrowFnAvailable() {
    return tryThis('[1 ,2, 3].map(x => x * x)', 'arrow function');
}

export function isObjectFreezeAvailable() {
    "use strict";
    if (!Object.freeze) {
        return false;
    }
    var foo = Object.freeze({});
    try {
        foo.bar = 1;
        return false;
    } catch (ex) {
        return true;
    }
}

export function isImportAvailable() {
    return tryThis('import fs from "fs"', 'import', true);
}

export function isExportAvailable() {
    return tryThis('export default function foo() {}', 'export', true);
}

export function isDefaultArgsAvailable() {
    return tryThis('function (a=1) { return a + 1; }', 'default args');
}

export function isInferredFunctionNameAvailable() {
    return tryThis('const foo = function () {}; require("assert").equal(foo.name, "foo")');
}
