/* globals it */

import { assert } from 'chai';
import Instrumenter from '../src/instrumenter';

function instrument(code) {
    // XXX produceSourceMap: true produces an altered source-map for the second run.
    const instrumenter = new Instrumenter({ produceSourceMap: false });
    const result = instrumenter.instrumentSync(code, __filename);
    return {
        code: result,
        coverageData: instrumenter.lastFileCoverage(),
        sourceMap: instrumenter.lastSourceMap()
    };
}

const instrumented = instrument(`console.log('basic test');`);

it('should not alter already instrumented code', () => {
    const result = instrument(instrumented.code);
    assert.deepEqual(instrumented, result);
});
