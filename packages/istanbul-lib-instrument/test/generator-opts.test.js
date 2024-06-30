/* globals describe, it, context */

const { assert } = require('chai');
const Instrumenter = require('../src/instrumenter');

const codeWithImportAttribute = `
  import foo from 'bar' with { type: 'json' };
`;

const generateCode = (code, parserPlugins, generatorOpts) => {
    const opts = {
        esModules: true,
        produceSourceMap: true,
        parserPlugins,
        generatorOpts
    };
    const instrumenter = new Instrumenter(opts);
    return instrumenter.instrumentSync(code, __filename);
};

describe('generatorOpts', () => {
    context('when the code has import attributes', () => {
        context('using "with" importAttributesKeyword', () => {
            it('should produce configured keyword', () => {
                const generated = generateCode(
                    codeWithImportAttribute,
                    [['importAttributes', { deprecatedAssertSyntax: true }]],
                    { importAttributesKeyword: 'with' }
                );
                assert.ok(generated);
                assert.ok(typeof generated === 'string');
                assert.ok(generated.includes("with{type:'json'}"));
            });
        });

        context('using "assert" importAttributesKeyword', () => {
            it('should produce configured keyword', () => {
                const generated = generateCode(
                    codeWithImportAttribute,
                    [['importAttributes', { deprecatedAssertSyntax: true }]],
                    { importAttributesKeyword: 'assert' }
                );
                assert.ok(generated);
                assert.ok(typeof generated === 'string');
                assert.ok(generated.includes("assert{type:'json'}"));
            });
        });
    });
});
