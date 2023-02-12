const path = require('path')

console.log(path.join(__dirname, '../src/**/*'))

module.exports = async () => {
  return {
    testMatch: [path.join(__dirname, '**/*.test.js')],
    testTimeout: 1000,
    collectCoverage: true,
    coverageDirectory: path.join(__dirname, '../.coverage')
  }
}