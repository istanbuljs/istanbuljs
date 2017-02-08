import template from 'babel-template';
import generate from 'babel-generator';
import * as T from 'babel-types';

const assignTemplate = template(`
    var VAR = DATA;
`);

// create a program that initializes a variable of the form
// var foo = { s0: { start: { line: 0, column: 0}, end: {line 1, column:0} }
// etc. where the number of keys is controlled by the items arg
function toProgram(items) {
    let obj = {};
    for (let i=0; i < items; i += 1) {
        const key = 's' + i;
        obj[key] = { start: { line: i, column: 0 }, end: { line: i + 1, column: 20 } };
    }
    const node = T.valueToNode(obj);
    const v = assignTemplate({
        VAR: T.identifier("foo"),
        DATA: node
    });
    return {
        'type': 'File',
        program: {  'type': 'Program', 'sourceType': 'script', body: [ v ] }
    };
}

const nopt = require('nopt');
const opts = {
    "compact": Boolean
};
const parsed = nopt(opts, null, process.argv, 2);
const compact = parsed.compact;

const generateOptions = {
    compact: compact
};

for (let i = 1; i < 15; i += 1) {
    const n = Math.pow(2, i);
    const prog = toProgram(n);
    const start = new Date().getTime();
    const codeMap = generate(prog, generateOptions, '');
    const end = new Date().getTime();
    if (i == 1) {
        console.log('Sample prog:', codeMap.code);
    }
    console.log('Items:', n, ', time:', (end - start));
}
