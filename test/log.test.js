import { describe, test, expect, vi } from 'vitest'
import { log, color, nameAndVersion, printVersionAndExit, printHelpAndExit, printStartupInfo } from '../src/log.js'

describe('nameAndVersion()', () => {
  test('returns package name and version', () => {
    expect(nameAndVersion()).toMatch(/^httpdir \d+\.\d+\.\d+$/)
  })
})

describe('color()', () => {
  test('wraps message with ANSI escape codes', () => {
    expect(color('hello', 'green')).toEqual('\x1b[32mhello\x1b[0m')
  })
  test('falls back to reset code for unknown color', () => {
    expect(color('hello', 'unknown')).toEqual('\x1b[0mhello\x1b[0m')
  })
})

describe('log()', () => {
  test('writes message to stdout', () => {
    const spy = vi.spyOn(process.stdout, 'write').mockImplementation(() => {})
    log('test message')
    expect(spy).toHaveBeenCalledWith('test message\n')
    spy.mockRestore()
  })
})

describe('printStartupInfo()', () => {
  test('logs basePath, name and urls', () => {
    const spy = vi.spyOn(console, 'log').mockImplementation(() => {})
    printStartupInfo('/some/path', 8080, ['http://localhost:8080'])
    expect(spy).toHaveBeenCalledTimes(3)
    spy.mockRestore()
  })
})

describe('printVersionAndExit()', () => {
  test('calls process.exit(0)', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {})
    const stdoutSpy = vi.spyOn(process.stdout, 'write').mockImplementation(() => {})
    printVersionAndExit()
    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
    stdoutSpy.mockRestore()
  })
})

describe('printHelpAndExit()', () => {
  test('calls process.exit(0)', () => {
    const exitSpy = vi.spyOn(process, 'exit').mockImplementation(() => {})
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
    printHelpAndExit()
    expect(exitSpy).toHaveBeenCalledWith(0)
    exitSpy.mockRestore()
    consoleSpy.mockRestore()
  })
})
