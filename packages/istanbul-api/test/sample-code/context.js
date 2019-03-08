const vm = require('vm');
const path = require('path');
const fs = require('fs');
const file = path.resolve(__dirname, 'foo.js');
const code = fs.readFileSync(file, 'utf8');

vm.runInThisContext(code, {
    filename: file
});
