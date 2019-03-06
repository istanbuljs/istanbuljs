/* globals describe, it */

import * as path from 'path';
import * as fs from 'fs';
import * as yaml from 'js-yaml';
import * as verifier from './util/verifier';
import * as guards from './util/guards';
import { assert } from 'chai';

const clone = require('clone');

const dir = path.resolve(__dirname, 'specs');
const files = fs.readdirSync(dir).filter(f => {
    var match = true;
    if (process.env.FILTER) {
        match = new RegExp(`.*${process.env.FILTER}.*`).test(f);
    }
    return f.match(/\.yaml$/) && match;
});

function loadDocs() {
    var docs = [];
    files.forEach(f => {
        var filePath = path.resolve(dir, f);
        var contents = fs.readFileSync(filePath, 'utf8');
        try {
            yaml.safeLoadAll(contents, obj => {
                obj.file = f;
                docs.push(obj);
            });
        } catch (ex) {
            docs.push({
                file: f,
                name: 'loaderr',
                err:
                    'Unable to load file [' +
                    f +
                    ']\n' +
                    ex.message +
                    '\n' +
                    ex.stack
            });
        }
    });
    return docs;
}

function generateTests(docs) {
    docs.forEach(doc => {
        var guard = doc.guard;
        var skip = false;
        var skipText = '';

        if (guard && guards[guard]) {
            if (!guards[guard]()) {
                skip = true;
                skipText = '[SKIP] ';
            }
        }

        describe(skipText + doc.file + '/' + (doc.name || 'suite'), () => {
            if (doc.err) {
                it('has errors', () => {
                    assert.ok(false, doc.err);
                });
            } else {
                (doc.tests || []).forEach(t => {
                    var fn = function() {
                        var genOnly = (doc.opts || {}).generateOnly;
                        var noCoverage = (doc.opts || {}).noCoverage;
                        var v = verifier.create(
                            doc.code,
                            doc.opts || {},
                            doc.instrumentOpts,
                            doc.inputSourceMap
                        );
                        var test = clone(t);
                        var args = test.args;
                        var out = test.out;
                        delete test.args;
                        delete test.out;
                        if (!genOnly && !noCoverage) {
                            v.verify(args, out, test);
                        }
                        if (noCoverage) {
                            assert.equal(v.code, v.generatedCode);
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
