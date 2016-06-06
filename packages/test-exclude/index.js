const assign = require('lodash.assign')
const arrify = require('arrify')
const micromatch = require('micromatch')
const path = require('path')

function TestExclude (opts) {
  assign(this, {
    cwd: process.cwd(),
    exclude: [
      'test/**',
      'test{,-*}.js',
      '**/*.test.js',
      '**/__tests__/**'
    ]
  }, opts)

  this.exclude = prepGlobPatterns(
    ['**/node_modules/**'].concat(arrify(this.exclude))
  )
}

TestExclude.prototype.shouldInstrument = function (filename) {
  var relFile = path.relative(this.cwd, filename)

  // Don't instrument files that are outside of the current working directory.
  if (/^\.\./.test(path.relative(this.cwd, filename))) return false

  relFile = relFile.replace(/^\.[\\\/]/, '') // remove leading './' or '.\'.
  return (!this.include || micromatch.any(relFile, this.include)) && !micromatch.any(relFile, this.exclude)
}

function prepGlobPatterns (patterns) {
  if (!patterns) return patterns

  var result = []

  function add (pattern) {
    if (result.indexOf(pattern) === -1) {
      result.push(pattern)
    }
  }

  patterns.forEach(function (pattern) {
    // Allow gitignore style of directory exclusion
    if (!/\/\*\*$/.test(pattern)) {
      add(pattern.replace(/\/$/, '') + '/**')
    }

    add(pattern)
  })

  return result
}

module.exports = function (opts) {
  return new TestExclude(opts)
}
