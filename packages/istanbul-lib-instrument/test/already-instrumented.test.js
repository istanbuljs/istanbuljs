/* globals it */

const { assert } = require('chai');
const Instrumenter = require('../src/instrumenter');

function instrument(code, inputSourceMap) {
    const instrumenter = new Instrumenter({ compact: false });
    const result = instrumenter.instrumentSync(
        code,
        __filename,
        inputSourceMap
    );
    return {
        code: result,
        coverageData: instrumenter.lastFileCoverage(),
        sourceMap: instrumenter.lastSourceMap()
    };
}

const instrumented = instrument(`console.log('basic test');`);

it('should not alter already instrumented code', () => {
    const result = instrument(instrumented.code, instrumented.sourceMap);
    [instrumented, result].forEach(({ sourceMap }) => {
        // XXX Ignore source-map difference caused by:
        // https://github.com/babel/babel/issues/10518
        delete sourceMap.mappings;
        delete sourceMap.names;
    });
    assert.deepEqual(instrumented, result);
});
