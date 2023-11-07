const path = require('path')
const fetch  = require('node-fetch')

const httpdir = require('../src/server.js')

describe('Server starts', () => {
  let server
  afterAll(() => server.stop())
  test('With default settings when calling start()', (done) => {
    server = httpdir.createServer()
    server.onStart(async ({ basePath, httpPort, urls }) => {
      expect(basePath).toEqual(path.resolve('.'))
      expect(httpPort).toEqual(8080)
      expect(urls).toContain('http://localhost:8080')
      const response = await fetch(`http://localhost:8080/readme.md`)
      expect(response.status).toEqual(200)
      done()
    })
    server.onError(done)
    server.start()
  })
})

describe('Server starts', () => {
  let server
  afterAll(() => server.stop())
  test('With custom settings when calling start()', (done) => {
    server = httpdir.createServer({ basePath: 'test', httpPort: 8181 })
    server.onStart(async ({ basePath, httpPort, urls }) => {
      expect(basePath).toEqual(path.resolve('test'))
      expect(httpPort).toEqual(8181)
      expect(urls).toContain('http://localhost:8181')
      const response = await fetch(`http://localhost:8181/startup.test.js`)
      expect(response.status).toEqual(200)
      done()
    })
    server.onError(done)
    server.start()
  })
})

test('Server stops when calling stop()', (done) => {
  const server = httpdir.createServer({ httpPort: 8282 })
  server.onStart(async () => server.stop())
  server.onStop(async () => {
    try {
      await fetch('http://localhost:8282')
      throw new Error('Server should not be running')
    } catch (error) {
      expect(error.code).toEqual('ECONNREFUSED')
      done()
    }
  })
  server.onError(done)
  server.start()
})