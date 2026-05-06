import { describe, test, expect } from 'vitest'
import { HttpError } from '../src/httpError.js'

describe('HttpError', () => {
  test('extends Error with message and httpCode', () => {
    const error = new HttpError('Not found', 404)
    expect(error).toBeInstanceOf(Error)
    expect(error.message).toEqual('Not found')
    expect(error.httpCode).toEqual(404)
  })
})
