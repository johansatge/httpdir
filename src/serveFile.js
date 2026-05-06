import fs from 'fs'
import { promises as fsp } from 'fs'
import path from 'path'
import { getMimeType } from './mimeType.js'
import { nameAndVersion } from './log.js'

export {
  serveFile,
  serveFavicon,
}

/**
 * Serve a file (stream the file from disk to the response output)
 * Supports bytes range to stream large files to compatible browsers, like videos
 * (https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Range)
 */
async function serveFile({ basePath, requestedPath, fileStat, request, response }) {
  const requestedRange = request.headers.range ? request.headers.range.match(/bytes=([0-9]+)?-([0-9]+)?/i) : null
  let rangeStart = null
  let rangeEnd = null
  if (requestedRange) {
    rangeStart = parseInt(requestedRange[1] || '')
    rangeEnd = parseInt(requestedRange[2] || '') || fileStat.size - 1
    if (isNaN(rangeStart)) {
      rangeStart = fileStat.size - rangeEnd
    }
  }
  if (requestedRange && (rangeStart >= fileStat.size || rangeEnd >= fileStat.size)) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Status/416
    response.writeHead(416, {
      'Content-Range': `bytes */${fileStat.size}`,
      'X-Served-By': nameAndVersion(),
    })
    response.end()
    return { httpCode: 416 }
  }
  const responseHeaders = {
    'Content-Type': await getMimeType(requestedPath),
    'Cache-Control': 'no-cache, no-store',
    'X-Served-By': nameAndVersion(),
  }
  if (requestedRange) {
    // https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Content-Range
    responseHeaders['Content-Length'] = rangeEnd - rangeStart + 1
    responseHeaders['Content-Range'] = `bytes ${rangeStart}-${rangeEnd}/${fileStat.size}`
    responseHeaders['Accept-Ranges'] = 'bytes'
  } else {
    responseHeaders['Content-Length'] = fileStat.size
  }
  const httpCode = requestedRange ? 206 : 200
  response.writeHead(httpCode, responseHeaders)
  const readStreamOptions = requestedRange ? { start: rangeStart, end: rangeEnd } : undefined
  const readStream = fs.createReadStream(path.join(basePath, requestedPath), readStreamOptions)
  readStream.pipe(response)
  return { httpCode }
}

/**
 * Serve the project favicon
 * (From disk if it exists, or the one from the project)
 */
async function serveFavicon({ basePath, request, response }) {
  try {
    const fileStat = await fsp.stat(path.join(basePath, 'favicon.ico'))
    if (fileStat.isFile()) {
      return await serveFile({ basePath, requestedPath: '/favicon.ico', fileStat, request, response })
    }
  } catch(error) {
    const filePath = path.join(import.meta.dirname, 'ui/favicon.ico')
    const fileStat = await fsp.stat(filePath)
    response.writeHead(200, {
      'Content-Type': 'image/x-icon',
      'Content-Length': fileStat.size,
      'Cache-Control': 'no-cache, no-store',
      'X-Served-By': nameAndVersion(),
    })
    const readStream = fs.createReadStream(filePath)
    readStream.pipe(response)
    return { httpCode: 200 }
  }
}
