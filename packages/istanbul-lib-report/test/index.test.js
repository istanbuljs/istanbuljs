'use strict';
/* globals describe, it */

const assert = require('chai').assert;
const index = require('../index');

describe('report interface', () => {
    it('exports the desired interface', () => {
        assert.isFunction(index.createContext);
        assert.isFunction(index.getDefaultWatermarks);
    });
    it('exposes default watermarks', () => {
        const w = index.getDefaultWatermarks();
        assert.deepEqual(
            {
                statements: [50, 80],
                functions: [50, 80],
                branches: [50, 80],
                lines: [50, 80]
            },
            w
        );
    });
});
