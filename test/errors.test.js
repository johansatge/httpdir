import { describe, test, expect, afterEach } from 'vitest'
import * as httpdir from '../src/server.js'

describe('Server fires onError()', () => {
  let server
  afterEach(() => server.stop())
  test('If the base path is invalid', async () => {
    server = httpdir.createServer({ basePath: {} })
    const error = await new Promise((resolve) => {
      server.onError(resolve)
      server.start()
    })
    expect(error.message).toContain('Invalid base path')
  })
})

describe('Server fires onError()', () => {
  let server
  afterEach(() => server.stop())
  test('If the port invalid', async () => {
    server = httpdir.createServer({ httpPort: -1 })
    const error = await new Promise((resolve) => {
      server.onError(resolve)
      server.start()
    })
    expect(error.message).toContain('Invalid port number')
  })
})

describe('Server fires onError()', () => {
  let server1
  afterEach(() => server1.stop())
  test('If it cannot start', async () => {
    server1 = httpdir.createServer({ httpPort: 8383 })
    await new Promise((resolve, reject) => {
      server1.onStart(resolve)
      server1.onError(reject)
      server1.start()
    })
    const error = await new Promise((resolve, reject) => {
      const server2 = httpdir.createServer({ httpPort: 8383 })
      server2.onStart(() => reject(new Error('Server should not start')))
      server2.onError(resolve)
      server2.start()
    })
    expect(error.message).toContain('already in use')
  })
})
