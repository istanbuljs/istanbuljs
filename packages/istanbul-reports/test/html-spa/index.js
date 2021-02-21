'use strict';
/* globals describe, it, afterEach, before, after */
const fs = require('fs');
const path = require('path');
const FileWriter = require('istanbul-lib-report/lib/file-writer');
const istanbulLibReport = require('istanbul-lib-report');
const istanbulLibCoverage = require('istanbul-lib-coverage');
const HtmlSpaReport = require('../../lib/html-spa/index');

const assert = require('chai').assert;

describe('html-spa', () => {
    let fileWriterCopyFile;
    let fileWriterWriteFile;
    let operations = [];
    before(() => {
        fileWriterCopyFile = FileWriter.prototype.copyFile;
        fileWriterWriteFile = FileWriter.prototype.writeFile;

        FileWriter.prototype.copyFile = function(source, dest, header) {
            operations.push({
                type: 'copy',
                source,
                dest,
                header
            });
        };
        FileWriter.prototype.writeFile = function(file) {
            const writeFileOp = {
                type: 'write',
                contents: '',
                file,
                baseDir: this.baseDir
            };
            operations.push(writeFileOp);
            return {
                write(str) {
                    writeFileOp.contents += str;
                },
                close() {}
            };
        };
    });
    afterEach(() => {
        operations = [];
    });
    after(() => {
        FileWriter.prototype.copyFile = fileWriterCopyFile;
        FileWriter.prototype.writeFile = fileWriterWriteFile;
    });

    function createTest(file) {
        const fixture = require(path.resolve(
            __dirname,
            '../fixtures/specs/' + file
        ));
        it(fixture.title, () => {
            const context = istanbulLibReport.createContext({
                dir: './',
                coverageMap: istanbulLibCoverage.createCoverageMap(fixture.map)
            });
            const tree = context.getTree('nested');
            const report = new HtmlSpaReport(fixture.opts);
            tree.visit(report, context);

            // copy operations should always be the same
            assert.deepEqual(operations.filter(op => op.type === 'copy'), [
                {
                    type: 'copy',
                    source: path.join(
                        __dirname,
                        '../../lib/html/assets/base.css'
                    ),
                    dest: './base.css',
                    header: undefined
                },
                {
                    type: 'copy',
                    source: path.join(
                        __dirname,
                        '../../lib/html/assets/block-navigation.js'
                    ),
                    dest: './block-navigation.js',
                    header: '/* eslint-disable */\n'
                },
                {
                    dest: './favicon.png',
                    header: undefined,
                    source: path.join(
                        __dirname,
                        '/../../lib/html/assets/favicon.png'
                    ),
                    type: 'copy'
                },
                {
                    type: 'copy',
                    source: path.join(
                        __dirname,
                        '../../lib/html/assets/sort-arrow-sprite.png'
                    ),
                    dest: './sort-arrow-sprite.png',
                    header: undefined
                },
                {
                    type: 'copy',
                    source: path.join(
                        __dirname,
                        '../../lib/html/assets/sorter.js'
                    ),
                    dest: './sorter.js',
                    header: '/* eslint-disable */\n'
                },
                {
                    type: 'copy',
                    source: path.join(
                        __dirname,
                        '../../lib/html/assets/vendor/prettify.css'
                    ),
                    dest: './prettify.css',
                    header: undefined
                },
                {
                    type: 'copy',
                    source: path.join(
                        __dirname,
                        '../../lib/html/assets/vendor/prettify.js'
                    ),
                    dest: './prettify.js',
                    header: '/* eslint-disable */\n'
                },
                {
                    type: 'copy',
                    source: path.join(
                        __dirname,
                        '../../lib/html-spa/assets/bundle.js'
                    ),
                    dest: './bundle.js',
                    header: undefined
                },
                {
                    type: 'copy',
                    source: path.join(
                        __dirname,
                        '../../lib/html-spa/assets/sort-arrow-sprite.png'
                    ),
                    dest: './sort-arrow-sprite.png',
                    header: undefined
                },
                {
                    type: 'copy',
                    source: path.join(
                        __dirname,
                        '../../lib/html-spa/assets/spa.css'
                    ),
                    dest: './spa.css',
                    header: undefined
                }
            ]);

            assert.deepEqual(
                operations
                    .filter(op => op.type === 'write')
                    .map(op => path.join(op.baseDir, op.file)),
                fixture.htmlSpaFiles.map(p => path.join(...[].concat(p)))
            );

            assert.deepEqual(
                JSON.parse(
                    operations
                        .filter(
                            op =>
                                op.type === 'write' && op.file === 'index.html'
                        )[0]
                        .contents.match(/window\.data = ([^;]+);/)[1]
                ),
                fixture.htmlSpaCoverageData
            );
        });
    }

    fs.readdirSync(path.resolve(__dirname, '../fixtures/specs')).forEach(
        file => {
            if (file.indexOf('.json') !== -1) {
                createTest(file);
            }
        }
    );
});
