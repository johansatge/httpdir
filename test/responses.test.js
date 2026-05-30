// This is a comment to be tested

import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import path from 'path'
import { promises as fsp } from 'fs'
import * as httpdir from '../src/server.js'

function start(server) {
  return new Promise((resolve, reject) => {
    server.onStart(resolve)
    server.onError(reject)
    server.start()
  })
}

function waitForResponse(server) {
  return new Promise((resolve) => server.onResponse(resolve))
}

describe('Server', () => {
  let server
  beforeAll(async () => {
    server = httpdir.createServer({ httpPort: 8484 })
    await start(server)
  })
  afterAll(() => server.stop())
  test('Fires onResponse() when a resource is fetched', async () => {
    const responsePromise = waitForResponse(server)
    fetch('http://localhost:8484/favicon.ico')
    const { requestedPath, requestedMethod, httpCode } = await responsePromise
    expect(requestedPath).toEqual('/favicon.ico')
    expect(requestedMethod).toEqual('GET')
    expect(httpCode).toEqual(200)
  })
})

describe('Server', () => {
  let server
  beforeAll(async () => {
    server = httpdir.createServer({ httpPort: 8585, basePath: 'test' })
    await start(server)
  })
  afterAll(() => server.stop())
  test('Serves a directory', async () => {
    const response = await fetch('http://localhost:8585')
    const html = await response.text()
    expect(html).toContain('href="errors.test.js"')
    expect(html).toContain('href="responses.test.js"')
    expect(response.headers.get('content-type')).toEqual('text/html')
  })
})

describe('Server', () => {
  let server
  beforeAll(async () => {
    server = httpdir.createServer({ httpPort: 8686, basePath: 'test' })
    await start(server)
  })
  afterAll(() => server.stop())
  test('Serves a file', async () => {
    const response = await fetch('http://localhost:8686/responses.test.js')
    const js = await response.text()
    const fileStat = await fsp.stat(path.join(import.meta.dirname, 'responses.test.js'))
    expect(response.status).toEqual(200)
    expect(js).toContain('This is a comment to be tested')
    expect(response.headers.get('content-type')).toEqual('application/javascript')
    expect(response.headers.get('content-length')).toEqual(String(fileStat.size))
    expect(response.headers.get('accept-ranges')).toEqual('bytes')
  })
})

describe('Server', () => {
  let server
  beforeAll(async () => {
    server = httpdir.createServer({ httpPort: 8787, basePath: 'test' })
    await start(server)
  })
  afterAll(() => server.stop())
  test('Serves a file with bytes range support', async () => {
    const response = await fetch('http://localhost:8787/responses.test.js', {
      headers: { Range: 'bytes=2-100' }
    })
    const js = await response.text()
    const fileStat = await fsp.stat(path.join(import.meta.dirname, 'responses.test.js'))
    expect(response.status).toEqual(206)
    expect(js).toContain('This is a comment to be tested')
    expect(response.headers.get('content-type')).toEqual('application/javascript')
    expect(response.headers.get('content-length')).toEqual('99')
    expect(response.headers.get('content-range')).toEqual(`bytes 2-100/${fileStat.size}`)
    expect(response.headers.get('accept-ranges')).toEqual('bytes')
  })
})

describe('Server', () => {
  let server
  beforeAll(async () => {
    server = httpdir.createServer({ httpPort: 8888, basePath: 'test' })
    await start(server)
  })
  afterAll(() => server.stop())
  test('Serves an error if bytes range is invalid', async () => {
    const response = await fetch('http://localhost:8888/responses.test.js', {
      headers: { Range: 'bytes=10000-20000' }
    })
    const fileStat = await fsp.stat(path.join(import.meta.dirname, 'responses.test.js'))
    expect(response.status).toEqual(416)
    expect(response.headers.get('content-range')).toEqual(`bytes */${fileStat.size}`)
  })
})
