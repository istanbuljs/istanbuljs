/* globals describe, it */

import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as verifier from './util/verifier';
import * as guards from './util/guards';
import {assert} from 'chai';

const clone = require('clone');

const dir = path.resolve(__dirname, 'specs'),
    files = fs.readdirSync(dir).filter(function (f) {
        return f.match(/\.yaml$/);
    });

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

function generateTests(docs) {
    docs.forEach(function (doc) {
        var guard = doc.guard,
            skip = false,
            skipText = '';

        if (guard && guards[guard]) {
            if (!guards[guard]()) {
                skip = true;
                skipText = '[SKIP] ';
            }
        }

        describe(skipText + doc.file + '/' + (doc.name || 'suite'), function () {
            if (doc.err) {
                it('has errors', function () {
                    assert.ok(false, doc.err);
                });
            }
            else {
                (doc.tests || []).forEach(function (t) {
                    var fn =  function () {
                        var genOnly = (doc.opts || {}).generateOnly,
                            v = verifier.create(doc.code, doc.opts || {}, doc.instrumentOpts, doc.inputSourceMap),
                            test = clone(t),
                            args = test.args,
                            out = test.out;
                        delete test.args;
                        delete test.out;
                        if (!genOnly) {
                            v.verify(args, out, test);
                        }
                    };
                    if (skip) {
                        it.skip(t.name || 'default test', fn);
                    } else {
                        it(t.name || 'default test', fn);
                    }
                });
            }
        });
    });
}

generateTests(loadDocs());
