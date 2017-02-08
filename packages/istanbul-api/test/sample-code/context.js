var vm = require('vm'),
    path = require('path'),
    fs = require('fs'),
    file = path.resolve(__dirname, 'foo.js'),
    code = fs.readFileSync(file, 'utf8');

vm.runInThisContext(code, file);
