/* globals describe, it, context */

import Instrumenter from '../src/instrumenter';
import {assert} from 'chai';

const codeNeedDecoratorPlugin = `
  @decorator
  class MyClass {}
`;

const generateCode = (staticType, code, plugins = []) => {
  const opts = {
      esModules: true,
      produceSourceMap: true,
      staticType,
      plugins
  };
  const instrumenter = new Instrumenter(opts);
  return instrumenter.instrumentSync(code, __filename);
};

describe('plugins', function () {
  context('when the code has a decorator', function() {
    context('without decorator plugin', function() {
      it('should fail', function (done) {
          try {
            generateCode('flow', codeNeedDecoratorPlugin);
          } catch(e) {
            const expected =
            `This experimental syntax requires enabling one of the following parser plugin(s): 'decorators-legacy, decorators'`;
            assert.ok(e.message.includes(expected));
            done();
          }
        });
    });

    context('with decorator plugin', function() {
      it('should success', function () {
        const generated = generateCode('flow', codeNeedDecoratorPlugin, ['decorators']);
        assert.ok(generated);
        assert.ok(typeof generated === 'string');
      });
    });
  });
});
