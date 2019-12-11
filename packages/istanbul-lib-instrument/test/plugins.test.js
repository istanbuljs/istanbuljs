/* globals describe, it, context */

import { assert } from 'chai';
import Instrumenter from '../src/instrumenter';

const codeNeedDecoratorPlugin = `
  @decorator
  class MyClass {}
`;

const generateCode = (code, parserPlugins) => {
    const opts = {
        esModules: true,
        produceSourceMap: true,
        parserPlugins
    };
    const instrumenter = new Instrumenter(opts);
    return instrumenter.instrumentSync(code, __filename);
};

describe('plugins', () => {
    context('when the code has a decorator', () => {
        context('without decorator plugin', () => {
            it('should fail', done => {
                try {
                    generateCode(codeNeedDecoratorPlugin);
                } catch (e) {
                    assert.ok(e);
                    done();
                }
            });
        });

        context('with decorator plugin', () => {
            it('should success', () => {
                const generated = generateCode(codeNeedDecoratorPlugin, [
                    ['decorators', { decoratorsBeforeExport: false }]
                ]);
                assert.ok(generated);
                assert.ok(typeof generated === 'string');
            });
        });
    });
});
