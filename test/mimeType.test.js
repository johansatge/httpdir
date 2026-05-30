import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import os from 'os'
import path from 'path'
import { promises as fsp } from 'fs'
import { getMimeType, isUtf8 } from '../src/mimeType.js'

describe('getMimeType()', () => {
  test('returns MIME type for known extension', () => {
    expect(getMimeType('/path/file.html')).toEqual('text/html')
    expect(getMimeType('/path/file.json')).toEqual('application/json')
    expect(getMimeType('/path/file.txt')).toEqual('text/plain')
  })
  test('returns application/octet-stream for unknown extension', () => {
    expect(getMimeType('/path/file.unknown')).toEqual('application/octet-stream')
  })
})

describe('isUtf8()', () => {
  let tmpDir

  beforeAll(async () => {
    tmpDir = await fsp.mkdtemp(path.join(os.tmpdir(), 'httpdir-test-'))
  })

  afterAll(async () => {
    await fsp.rm(tmpDir, { recursive: true })
  })

  test('returns true for a plain UTF-8 file', async () => {
    const filePath = path.join(tmpDir, 'utf8.txt')
    await fsp.writeFile(filePath, 'Hello, World! 🌍', 'utf-8')
    expect(await isUtf8(filePath)).toBe(true)
  })

  test('returns true for a UTF-8 file with BOM', async () => {
    const filePath = path.join(tmpDir, 'utf8-bom.txt')
    const bom = Buffer.from([0xEF, 0xBB, 0xBF])
    await fsp.writeFile(filePath, Buffer.concat([bom, Buffer.from('Hello', 'utf-8')]))
    expect(await isUtf8(filePath)).toBe(true)
  })

  test('returns false for a file with invalid UTF-8 bytes', async () => {
    const filePath = path.join(tmpDir, 'latin1.txt')
    await fsp.writeFile(filePath, Buffer.from([0x48, 0x65, 0x6C, 0x6C, 0x6F, 0x80, 0x90]))
    expect(await isUtf8(filePath)).toBe(false)
  })

  test('returns false for a UTF-16 LE file', async () => {
    const filePath = path.join(tmpDir, 'utf16.txt')
    await fsp.writeFile(filePath, Buffer.from([0xFF, 0xFE, 0x48, 0x00, 0x69, 0x00]))
    expect(await isUtf8(filePath)).toBe(false)
  })
})
