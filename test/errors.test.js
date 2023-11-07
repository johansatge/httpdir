const path = require('path')

const httpdir = require('../src/server.js')

describe('Server fires onError()', () => {
  let server
  afterEach(() => server.stop())
  test('If the base path is invalid', (done) => {
    server = httpdir.createServer({ basePath: {} })
    server.onStart(() => {
      throw new Error('Server should not start')
    })
    server.onError((error) => {
      expect(error.message).toContain('Invalid base path')
      done()
    })
    server.start()
  })
})

describe('Server fires onError()', () => {
  let server
  afterEach(() => server.stop())
  test('If the port invalid', (done) => {
    server = httpdir.createServer({ httpPort: -1 })
    server.onStart(() => {
      throw new Error('Server should not start')
    })
    server.onError((error) => {
      expect(error.message).toContain('Invalid port number')
      done()
    })
    server.start()
  })
})

describe('Server fires onError()', () => {
  let server1
  afterEach(() => server1.stop())
  test('If it cannot start', (done) => {
    server1 = httpdir.createServer({ httpPort: 8383 })
    server1.onStart(() => {
      const server2 = httpdir.createServer({ httpPort: 8383 })
      server2.onStart(() => {
        throw new Error('Server should not start')
      })
      server2.onError((error) => {
        expect(error.message).toContain('already in use')
        done()
      })
      server2.start()
    })
    server1.start()
  })
})
