const fs = require('fs')
const fsp = require('fs').promises
const path = require('path')
const { getMimeType } = require('./mimeType.js')
const { nameAndVersion } = require('./log.js')

module.exports = {
  serveFile,
  serveFavicon,
}

/**
 * Serve a file (stream the file from disk to the response output)
 */
async function serveFile({ basePath, requestedPath, fileStat, response }) {
  const mimeType = await getMimeType(requestedPath)
  response.writeHead(200, {
    'Content-Type': mimeType,
    'Content-Length': fileStat.size,
    'Cache-Control': 'no-cache, no-store',
    'X-Served-By': nameAndVersion(),
  })
  const readStream = fs.createReadStream(path.join(basePath, requestedPath))
  readStream.pipe(response)
}

/**
 * Serve the project favicon
 * (From disk if it exists, or the one from the project)
 */
async function serveFavicon({ basePath, response }) {
  try {
    const fileStat = await fsp.stat(path.join(basePath, 'favicon.ico'))
    if (fileStat.isFile()) {
      await serveFile({ basePath, requestedPath: '/favicon.ico', fileStat, response})
    }
  } catch(error) {
    const filePath = path.join(__dirname, 'ui/favicon.ico')
    const fileStat = await fsp.stat(filePath)
    response.writeHead(200, {
      'Content-Type': 'image/x-icon',
      'Content-Length': fileStat.size,
      'Cache-Control': 'no-cache, no-store',
      'X-Served-By': nameAndVersion(),
    })
    const readStream = fs.createReadStream(filePath)
    readStream.pipe(response)
  }
}
