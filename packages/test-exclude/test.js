/* global describe, it */

const exclude = require('./')

require('chai').should()

describe('testExclude', function () {
  it('should always exclude node_modules folder', function () {
    exclude().shouldInstrument('./banana/node_modules/cat.js').should.equal(false)
  })

  it('ignores ./', function () {
    exclude().shouldInstrument('./test.js').should.equal(false)
  })

  it('does not instrument files outside cwd', function () {
    exclude().shouldInstrument('../foo.js').should.equal(false)
  })
})
