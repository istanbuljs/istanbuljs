/* globals describe, it, context */

import Instrumenter from '../src/instrumenter';
import {assert} from 'chai';

// The code is unsupported for typescript
const flowCode = 'let a: ?string';

// The code is unsupported for flow
const typescriptCode = `
  export class MyClass {
    private readonly logger: object
  }
`;

const generateCode = (staticType, code) => {
  const opts = {
      esModules: true,
      produceSourceMap: true,
      staticType
  };
  const instrumenter = new Instrumenter(opts);
  return instrumenter.instrumentSync(code, __filename);
};

describe('staticType', function () {
  context('option is FLOW and code style is FLOW', function() {
    it('should success', function () {
        const generated = generateCode('flow', flowCode);

        assert.ok(generated);
        assert.ok(typeof generated === 'string');
      });
  });

  context('option is FLOW and code style is TYPESCRIPT', function() {
    it('should fail', function (done) {
      try {
        generateCode('flow', typescriptCode);
      } catch(e) {
        assert.ok(e.message.includes('Unexpected token'));
        done();
      }
    });
  });

  context('option is TYPESCRIPT and code style is TYPESCRIPT', function() {
    it('should success', function () {
        const generated = generateCode('typescript', typescriptCode);

        assert.ok(generated);
        assert.ok(typeof generated === 'string');
    });
  });

  context('option is TYPESCRIPT and code style is FLOW', function() {
    it('should fail', function (done) {
        try {
          generateCode('typescript', flowCode);
        } catch(e) {
          assert.ok(e.message.includes('Unexpected token'));
          done();
        }
    });
  });
});
