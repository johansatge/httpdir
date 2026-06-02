import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import { promises as fsp } from 'fs'
import path from 'path'
import os from 'os'
import * as httpdir from '../src/server.js'

function start(server) {
  return new Promise((resolve, reject) => {
    server.onStart(resolve)
    server.onError(reject)
    server.start()
  })
}

describe('Server blocks symlink traversal to an unrelated directory', () => {
  let server
  let tmpDir

  beforeAll(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'httpdir-test-'))
    await fsp.mkdir(path.join(tmpDir, 'served'))
    await fsp.mkdir(path.join(tmpDir, 'outside'))
    await fsp.writeFile(path.join(tmpDir, 'outside', 'secret.txt'), 'secret content')
    await fsp.symlink(
      path.join(tmpDir, 'outside', 'secret.txt'),
      path.join(tmpDir, 'served', 'escape')
    )
    server = httpdir.createServer({ basePath: path.join(tmpDir, 'served'), httpPort: 9191 })
    await start(server)
  })

  afterAll(async () => {
    server.stop()
    await fsp.rm(tmpDir, { recursive: true })
  })

  test('Returns 403 when a symlink points outside the base directory', async () => {
    const response = await fetch('http://localhost:9191/escape')
    expect(response.status).toEqual(403)
  })
})

describe('Server blocks symlink traversal to a sibling directory with a shared name prefix', () => {
  let server
  let tmpDir

  beforeAll(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'httpdir-test-'))
    await fsp.mkdir(path.join(tmpDir, 'served'))
    await fsp.mkdir(path.join(tmpDir, 'servedmore'))
    await fsp.writeFile(path.join(tmpDir, 'servedmore', 'secret.txt'), 'secret content')
    await fsp.symlink(
      path.join(tmpDir, 'servedmore', 'secret.txt'),
      path.join(tmpDir, 'served', 'escape')
    )
    server = httpdir.createServer({ basePath: path.join(tmpDir, 'served'), httpPort: 9292 })
    await start(server)
  })

  afterAll(async () => {
    server.stop()
    await fsp.rm(tmpDir, { recursive: true })
  })

  test('Returns 403 when a symlink points to a sibling directory whose name starts with the base path name', async () => {
    const response = await fetch('http://localhost:9292/escape')
    expect(response.status).toEqual(403)
  })
})
