const fsp = require('fs').promises
const http = require('http')
const os = require('os')
const path = require('path')
const { serveDirectory } = require('./serveDirectory.js')
const { serveFavicon, serveFile } = require('./serveFile.js')
const { HttpError } = require('./httpError.js')

module.exports = {
  createServer,
}

function createServer({ basePath = '.', httpPort = 8080 } = {}) {

  basePath = typeof basePath === 'string' ? path.resolve(basePath) : null
  httpPort = parseInt(httpPort)

  const callbacks = {
    onStart: () => {},
    onStop: () => {},
    onResponse: () => {},
    onError: () => {},
  }
  const registerCallback = (name, callback) => {
    if (typeof callback === 'function') {
      callbacks[name] = callback
    }
  }

  const server = http.createServer()
  server.on('request', onServerRequest)
  server.on('error', onServerError)

  return {
    start: startServer,
    stop: stopServer,
    onStart: (callback) => { registerCallback('onStart', callback) },
    onStop: (callback) => { registerCallback('onStop', callback) },
    onResponse: (callback) => { registerCallback('onResponse', callback) },
    onError: (callback) => { registerCallback('onError', callback) },
  }

  function startServer() {
    if (!Number.isInteger(httpPort) || httpPort <= 1024) {
      callbacks.onError(new Error('Invalid port number'))
      return
    }
    if (typeof basePath !== 'string' || basePath.length === 0) {
      callbacks.onError(new Error('Invalid base path'))
      return
    }
    server.listen(httpPort)
    if (server.listening) {
      callbacks.onStart({ basePath, httpPort, urls: getUrls() })
    }
  }

  function getUrls() {
    const nets = os.networkInterfaces()
    const urls = [`http://localhost:${httpPort}`]
    for (const name of Object.keys(nets)) {
      for (const net of nets[name]) {
        if (net.family === 'IPv4') {
          urls.push(`http://${net.address}:${httpPort}`)
        }
      }
    }
    return urls
  }

  function stopServer() {
    server.close(callbacks.onStop)
  }

  function onServerError(error) {
    callbacks.onError(error)
  }

  async function onServerRequest(request, response) {
    const parsedUrl = new URL(request.url, `http://${request.headers.host}/`)
    const requestedPath = decodeURIComponent(parsedUrl.pathname)
    try {
      // GET requests allowed
      if (request.method !== 'GET') {
        throw new HttpError(`Method not allowed ${request.method}`, 405)
      }
      // Project favicon
      if (requestedPath === '/favicon.ico') {
        await serveFavicon({ basePath, response })
        return
      }
      // Block request to directories above the base one
      const fullRequestedPath = path.resolve(path.join(basePath, requestedPath))
      if (!fullRequestedPath.startsWith(basePath)) {
        throw new HttpError('Resource not allowed', 403)
      }
      // 404 error
      let fileStat
      try {
        fileStat = await fsp.stat(path.join(basePath, requestedPath))
      } catch(error) {
        throw new HttpError(`Resource ${requestedPath} not found`, 404)
      }
      // Serve a directory listing
      if (fileStat.isDirectory()) {
        await serveDirectory({ basePath, requestedPath, response })
        callbacks.onResponse({ requestedPath, requestedMethod: 'GET', httpCode: 200 })
        return
      }
      // Serve a file from disk
      if (fileStat.isFile()) {
        await serveFile({ basePath, requestedPath, fileStat, response })
        callbacks.onResponse({ requestedPath, requestedMethod: 'GET', httpCode: 200 })
        return
      }
      // Other
      throw new HttpError(`Resource ${requestedPath} is neither a file or directory`, 404)
    } catch(error) {
      response.writeHead(error.httpCode, { 'Content-Type': 'text/plain' })
      response.end(error.message)
      callbacks.onResponse({
        requestedPath,
        requestedMethod: request.method,
        httpCode: error.httpCode,
      })
    }
  }
}