'use strict';
/* globals describe, it, before, after, afterEach */
const FileWriter = require('istanbul-lib-report/lib/file-writer');
const istanbulLibReport = require('istanbul-lib-report');
const istanbulLibCoverage = require('istanbul-lib-coverage');
const HtmlReport = require('../../lib/html/index');

const assert = require('chai').assert;

describe('html', () => {
    let fileWriterCopyFile;
    let fileWriterWriteFile;
    let operations = [];
    before(() => {
        fileWriterCopyFile = FileWriter.prototype.copyFile;
        fileWriterWriteFile = FileWriter.prototype.writeFile;

        FileWriter.prototype.copyFile = function(source, dest, header) {
            operations.push({ type: 'copy', source, dest, header });
        };
        FileWriter.prototype.writeFile = function(file) {
            const writeFileOp = {
                type: 'write',
                contents: '',
                file
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

    function createMap() {
        return istanbulLibCoverage.createCoverageMap({
            '/project/full.js': {
                path: '/project/full.js',
                statementMap: {
                    0: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 10 }
                    }
                },
                fnMap: {},
                branchMap: {},
                s: { 0: 1 },
                f: {},
                b: {}
            },
            '/project/partial.js': {
                path: '/project/partial.js',
                statementMap: {
                    0: {
                        start: { line: 1, column: 0 },
                        end: { line: 1, column: 10 }
                    },
                    1: {
                        start: { line: 2, column: 0 },
                        end: { line: 2, column: 10 }
                    }
                },
                fnMap: {},
                branchMap: {},
                s: { 0: 1, 1: 0 },
                f: {},
                b: {}
            }
        });
    }

    function runReport(opts) {
        const context = istanbulLibReport.createContext({
            dir: './',
            coverageMap: createMap()
        });
        const tree = context.getTree('flat');
        const report = new HtmlReport(opts);
        tree.visit(report, context);
    }

    function writeOp(file) {
        return operations.find(op => op.type === 'write' && op.file === file);
    }

    it('excludes fully covered files from the summary when skipFull is set', () => {
        runReport({ skipFull: true });

        const contents = writeOp('index.html').contents;
        assert.notInclude(contents, 'full.js<');
        assert.include(contents, 'partial.js<');
    });

    it('includes fully covered files when skipFull is not set', () => {
        runReport({});

        const contents = writeOp('index.html').contents;
        assert.include(contents, 'full.js<');
        assert.include(contents, 'partial.js<');
    });

    it('still writes detail pages for fully covered files when skipFull is set', () => {
        runReport({ skipFull: true });

        assert.isOk(writeOp('full.js.html'));
    });
});
