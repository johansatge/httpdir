const path = require('path')
const fetch  = require('node-fetch')

const httpdir = require('../src/server.js')

describe('Server', () => {
  let server
  afterEach(() => {
    server.stop()
  })
  test('Starts with default settings when calling start()', (done) => {
    server = httpdir.createServer()
    server.onStart(async ({ basePath, httpPort, urls }) => {
      const response = await fetch(`http://localhost:8080/readme.md`)
      expect(basePath).toEqual(path.resolve('.'))
      expect(httpPort).toEqual(8080)
      expect(urls).toContain('http://localhost:8080')
      expect(response.status).toEqual(200)
      expect(response.headers.get('content-type')).toEqual('text/markdown')
      done()
    })
    server.onError(done)
    server.start()
  })
})

describe('Server', () => {
  let server
  afterEach(() => {
    server.stop()
  })
  test('Starts with custom settings when calling start()', (done) => {
    server = httpdir.createServer({ basePath: 'test', httpPort: 8181 })
    server.onStart(async ({ basePath, httpPort, urls }) => {
      const response = await fetch(`http://localhost:8181/server.test.js`)
      expect(basePath).toEqual(path.resolve('test'))
      expect(httpPort).toEqual(8181)
      expect(urls).toContain('http://localhost:8181')
      expect(response.status).toEqual(200)
      expect(response.headers.get('content-type')).toEqual('application/javascript')
      done()
    })
    server.onError(done)
    server.start()
  })
})

describe('Server', () => {
  test('Stops when calling stop()', (done) => {
    const server = httpdir.createServer({ httpPort: 8282 })
    server.onStart(async ({ basePath, httpPort }) => {
      server.stop()
    })
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
})

describe('Server', () => {
  let server
  afterEach(() => {
    server.stop()
  })
  test('Fires onError() if the base path is invalid', (done) => {
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

describe('Server', () => {
  let server
  afterEach(() => {
    server.stop()
  })
  test('Fires onError() if the port invalid', (done) => {
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

describe('Server', () => {
  let server1
  afterEach(() => {
    server1.stop()
  })
  test('Fires onError() if it cannot start', (done) => {
    server1 = httpdir.createServer({ httpPort: 8484 })
    server1.onStart(() => {
      const server2 = httpdir.createServer({ httpPort: 8484 })
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

describe('Server', () => {
  let server
  afterEach(() => {
    server.stop()
  })
  test('Fires onResponse() when a resource is fetched', (done) => {
    server = httpdir.createServer({ httpPort: 8383 })
    server.onStart(async () => {
      await fetch(`http://localhost:8383/readme.md`)
    })
    server.onResponse(({ requestedPath, requestedMethod, httpCode }) => {
      expect(requestedPath).toEqual('/readme.md')
      expect(requestedMethod).toEqual('GET')
      expect(httpCode).toEqual(200)
      done()
    })
    server.onError(done)
    server.start()
  })
})
