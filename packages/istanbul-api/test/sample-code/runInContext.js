var vm = require('vm');
var path = require('path');
var fs = require('fs');
var file = path.resolve(__dirname, 'foo.js');
var code = fs.readFileSync(file, 'utf8');

vm.runInContext(code, vm.createContext({}), file);
