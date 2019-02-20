/*
 Copyright 2015, Yahoo Inc.
 Copyrights licensed under the New BSD License. See the accompanying LICENSE file for terms.
 */
'use strict';

const debug = require('debug')('istanbuljs');
const libCoverage = require('istanbul-lib-coverage');
const pathutils = require('./pathutils');
const { MappedCoverage } = require('./mapped');

function isInvalidPosition(pos) {
    return (
        !pos ||
        typeof pos.line !== 'number' ||
        typeof pos.column !== 'number' ||
        pos.line < 0 ||
        pos.column < 0
    );
}

/**
 * AST ranges are inclusive for start positions and exclusive for end positions.
 * Source maps are also logically ranges over text, though interacting with
 * them is generally achieved by working with explicit positions.
 *
 * When finding the _end_ location of an AST item, the range behavior is
 * important because what we're asking for is the _end_ of whatever range
 * corresponds to the end location we seek.
 *
 * This boils down to the following steps, conceptually, though the source-map
 * library doesn't expose primitives to do this nicely:
 *
 * 1. Find the range on the generated file that ends at, or exclusively
 *    contains the end position of the AST node.
 * 2. Find the range on the original file that corresponds to
 *    that generated range.
 * 3. Find the _end_ location of that original range.
 */
function originalEndPositionFor(sourceMap, generatedEnd) {
    // Given the generated location, find the original location of the mapping
    // that corresponds to a range on the generated file that overlaps the
    // generated file end location. Note however that this position on its
    // own is not useful because it is the position of the _start_ of the range
    // on the original file, and we want the _end_ of the range.
    const beforeEndMapping = sourceMap.originalPositionFor({
        line: generatedEnd.line,
        column: generatedEnd.column - 1
    });
    if (beforeEndMapping.source === null) {
        return null;
    }

    // Convert that original position back to a generated one, with a bump
    // to the right, and a rightward bias. Since 'generatedPositionFor' searches
    // for mappings in the original-order sorted list, this will find the
    // mapping that corresponds to the one immediately after the
    // beforeEndMapping mapping.
    const afterEndMapping = sourceMap.generatedPositionFor({
        source: beforeEndMapping.source,
        line: beforeEndMapping.line,
        column: beforeEndMapping.column + 1,
        bias: 2
    });
    if (
        // If this is null, it means that we've hit the end of the file,
        // so we can use Infinity as the end column.
        afterEndMapping.line === null ||
        // If these don't match, it means that the call to
        // 'generatedPositionFor' didn't find any other original mappings on
        // the line we gave, so consider the binding to extend to infinity.
        sourceMap.originalPositionFor(afterEndMapping).line !==
            beforeEndMapping.line
    ) {
        return {
            source: beforeEndMapping.source,
            line: beforeEndMapping.line,
            column: Infinity
        };
    }

    // Convert the end mapping into the real original position.
    return sourceMap.originalPositionFor(afterEndMapping);
}

/**
 * determines the original position for a given location
 * @param  {SourceMapConsumer} sourceMap the source map
 * @param  {Object} generatedLocation the original location Object
 * @returns {Object} the remapped location Object
 */
function getMapping(sourceMap, generatedLocation, origFile) {
    if (!generatedLocation) {
        return null;
    }

    if (
        isInvalidPosition(generatedLocation.start) ||
        isInvalidPosition(generatedLocation.end)
    ) {
        return null;
    }

    const start = sourceMap.originalPositionFor(generatedLocation.start);
    let end = originalEndPositionFor(sourceMap, generatedLocation.end);

    /* istanbul ignore if: edge case too hard to test for */
    if (!(start && end)) {
        return null;
    }

    if (!(start.source && end.source)) {
        return null;
    }

    if (start.source !== end.source) {
        return null;
    }

    /* istanbul ignore if: edge case too hard to test for */
    if (start.line === null || start.column === null) {
        return null;
    }

    /* istanbul ignore if: edge case too hard to test for */
    if (end.line === null || end.column === null) {
        return null;
    }

    if (start.line === end.line && start.column === end.column) {
        end = sourceMap.originalPositionFor({
            line: generatedLocation.end.line,
            column: generatedLocation.end.column,
            bias: 2
        });
        end.column -= 1;
    }

    return {
        source: pathutils.relativeTo(start.source, origFile),
        loc: {
            start: {
                line: start.line,
                column: start.column
            },
            end: {
                line: end.line,
                column: end.column
            }
        }
    };
}

function getUniqueKey(path) {
    return path.replace(/[\\/]/g, '_');
}

function getOutput(cache) {
    return Object.keys(cache).reduce((output, key) => {
        const item = cache[key];
        return Object.assign(output, {
            [item.file]: item.mappedCoverage
        });
    }, {});
}

class SourceMapTransformer {
    constructor(finder, opts = {}) {
        this.finder = finder;
        this.baseDir = opts.baseDir || process.cwd();
    }

    processFile(fc, sourceMap, coverageMapper) {
        let changes = 0;

        Object.keys(fc.statementMap).forEach(s => {
            const loc = fc.statementMap[s];
            const hits = fc.s[s];
            const mapping = getMapping(sourceMap, loc, fc.path);

            if (mapping) {
                changes += 1;
                const mappedCoverage = coverageMapper(mapping.source);
                mappedCoverage.addStatement(mapping.loc, hits);
            }
        });

        Object.keys(fc.fnMap).forEach(f => {
            const fnMeta = fc.fnMap[f];
            const hits = fc.f[f];
            const mapping = getMapping(sourceMap, fnMeta.decl, fc.path);
            const spanMapping = getMapping(sourceMap, fnMeta.loc, fc.path);

            if (
                mapping &&
                spanMapping &&
                mapping.source === spanMapping.source
            ) {
                changes += 1;
                const mappedCoverage = coverageMapper(mapping.source);
                mappedCoverage.addFunction(
                    fnMeta.name,
                    mapping.loc,
                    spanMapping.loc,
                    hits
                );
            }
        });

        Object.keys(fc.branchMap).forEach(b => {
            const branchMeta = fc.branchMap[b];
            const hits = fc.b[b];
            const locs = [];
            const mappedHits = [];
            let source;
            let skip;

            branchMeta.locations.forEach((loc, i) => {
                const mapping = getMapping(sourceMap, loc, fc.path);
                if (mapping) {
                    if (!source) {
                        source = mapping.source;
                    }

                    if (mapping.source !== source) {
                        skip = true;
                    }

                    locs.push(mapping.loc);
                    mappedHits.push(hits[i]);
                }
            });

            if (!skip && locs.length > 0) {
                changes += 1;
                const mappedCoverage = coverageMapper(source);
                mappedCoverage.addBranch(
                    branchMeta.type,
                    locs[0] /* XXX */,
                    locs,
                    mappedHits
                );
            }
        });

        return changes > 0;
    }

    transform(coverageMap) {
        const uniqueFiles = {};
        const getMappedCoverage = file => {
            const key = getUniqueKey(file);
            if (!uniqueFiles[key]) {
                uniqueFiles[key] = {
                    file,
                    mappedCoverage: new MappedCoverage(file)
                };
            }

            return uniqueFiles[key].mappedCoverage;
        };

        coverageMap.files().forEach(file => {
            const fc = coverageMap.fileCoverageFor(file);
            const sourceMap = this.finder(file);
            if (!sourceMap) {
                uniqueFiles[getUniqueKey(file)] = {
                    file,
                    mappedCoverage: fc
                };
                return;
            }

            const changed = this.processFile(fc, sourceMap, getMappedCoverage);
            if (!changed) {
                debug(`File [${file}] ignored, nothing could be mapped`);
            }
        });

        return libCoverage.createCoverageMap(getOutput(uniqueFiles));
    }
}

module.exports = {
    create(finder, opts) {
        return new SourceMapTransformer(finder, opts);
    }
};
