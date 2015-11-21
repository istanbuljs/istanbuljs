var path = require('path'),
    fs = require('fs'),
    dir = path.resolve(__dirname, '..', 'test', 'instrumenter', 'test-cases'),
    outFile = path.resolve(__dirname, '..', 'test', 'instrumenter', 'generated-cases.js'),
    files = fs.readdirSync(dir).filter(function (f) {
        return f.match(/\.yaml$/);
    }),
    yaml = require('js-yaml');

function loadDocs() {
    var docs = [];
    files.forEach(function (f) {
        var filePath = path.resolve(dir, f),
            contents = fs.readFileSync(filePath, 'utf8');
        try {
            yaml.safeLoadAll(contents, function (obj) {
                obj.file = f;
                docs.push(obj);
            });
        } catch (ex) {
            docs.push({
                file: f,
                name: 'loaderr',
                err: "Unable to load file [" + f + "]\n" + ex.message + "\n" + ex.stack
            });
        }
    });
    return docs;
}

var docs = loadDocs(),
    script = '/*jshint maxlen: 10000 */\n/* globals window, module */\n(function (exports){\n\texports.testDocuments = ' +
        JSON.stringify(docs, null, 4) +
        ';\n})(typeof module === "undefined" ? window : module.exports);\n';
fs.writeFileSync(outFile, script, 'utf8');

module.exports = {
    getTests: function () {
        return require('../test/instrumenter/generated-cases.js').testDocuments;
    }
};