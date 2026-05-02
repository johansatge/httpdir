import { describe, test, expect, afterAll } from 'vitest'
import path from 'path'
import * as httpdir from '../src/server.js'

function start(server) {
  return new Promise((resolve, reject) => {
    server.onStart(resolve)
    server.onError(reject)
    server.start()
  })
}

function stop(server) {
  return new Promise((resolve) => {
    server.onStop(resolve)
    server.stop()
  })
}

describe('Server starts', () => {
  let server
  afterAll(() => server.stop())
  test('With default settings when calling start()', async () => {
    server = httpdir.createServer()
    const { basePath, httpPort, urls } = await start(server)
    expect(basePath).toEqual(path.resolve('.'))
    expect(httpPort).toEqual(8080)
    expect(urls).toContain('http://localhost:8080')
    const response = await fetch(`http://localhost:8080/readme.md`)
    expect(response.status).toEqual(200)
  })
})

describe('Server starts', () => {
  let server
  afterAll(() => server.stop())
  test('With custom settings when calling start()', async () => {
    server = httpdir.createServer({ basePath: 'test', httpPort: 8181 })
    const { basePath, httpPort, urls } = await start(server)
    expect(basePath).toEqual(path.resolve('test'))
    expect(httpPort).toEqual(8181)
    expect(urls).toContain('http://localhost:8181')
    const response = await fetch(`http://localhost:8181/startup.test.js`)
    expect(response.status).toEqual(200)
  })
})

test('Server stops when calling stop()', async () => {
  const server = httpdir.createServer({ httpPort: 8282 })
  await start(server)
  await stop(server)
  let fetchSucceeded = false
  try {
    await fetch('http://localhost:8282')
    fetchSucceeded = true
  } catch (error) {
    // connection refused, as expected
  }
  expect(fetchSucceeded).toBe(false)
})
