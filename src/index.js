#!/usr/bin/env node

const fsp = require('fs').promises
const http = require('http')
const { log, color, printVersionAndExit, printHelpAndExit, nameAndVersion } = require('./log.js')
const path = require('path')
const { serveDirectory } = require('./serveDirectory.js')
const { serveFavicon, serveFile } = require('./serveFile.js')

if (process.argv.includes('--version')) {
  printVersionAndExit()
}

if (process.argv.includes('--help')) {
  printHelpAndExit()
}

const basePath = path.resolve(process.argv[2] || '.')
const httpPort = parseInt(process.argv[3]) || 8080

try {
  const server = http.createServer()
  server.on('request', onServerRequest)
  server.on('error', onServerError)
  server.listen(httpPort)
  if (server.listening) {
    const message = [
      color(nameAndVersion(), 'purple'),
      `started ${color('http://localhost:' + httpPort, 'green')}`,
      `targeting ${color(basePath, 'cyan')}`,
    ]
    log(message.join(' '))
  }
} catch(error) {
  console.log(`Server could not start: ${error.message}`)
  process.exitCode = 1
}

async function onServerRequest(request, response) {
  const parsedUrl = new URL(request.url, `http://${request.headers.host}/`)
  const requestedPath = decodeURIComponent(parsedUrl.pathname)
  try {
    // GET requests allowed
    if (request.method !== 'GET') {
      throw new Error(`Invalid method ${request.method}`)
    }
    // Project favicon
    if (requestedPath === '/favicon.ico') {
      await serveFavicon({ basePath, response })
      return
    }
    // Block request to directories above the base one
    const fullRequestedPath = path.resolve(path.join(basePath, requestedPath))
    if (!fullRequestedPath.startsWith(basePath)) {
      throw new Error('Resource not allowed')
    }
    // Serve a directory listing
    const fileStat = await fsp.stat(path.join(basePath, requestedPath))
    if (fileStat.isDirectory()) {
      await serveDirectory({ basePath, requestedPath, response })
      log(`${color('GET', 'green')} ${requestedPath}`)
      return
    }
    // Serve a file from disk
    if (fileStat.isFile()) {
      await serveFile({ basePath, requestedPath, fileStat, response })
      log(`${color('GET', 'green')} ${requestedPath}`)
      return
    }
    // 404 error
    throw new Error(`Resource ${requestedPath} is neither a file or directory`)
  } catch(error) {
    response.writeHead(500, { 'Content-Type': 'text/plain' })
    response.end(`An error occurred: ${error.message}\n(${error.stack})`)
    log(`${color(request.method, 'red')} ${requestedPath}`)
  }
}

function onServerError(error) {
  log(`A server error occurred: ${color(error.message, 'red')}`)
  process.exitCode = 1
}
