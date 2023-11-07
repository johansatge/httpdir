#!/usr/bin/env node

const path = require('path')
const {
  log,
  color,
  printVersionAndExit,
  printHelpAndExit,
  printStartupInfo,
} = require('./log.js')
const { createServer } = require('./server.js')

if (process.argv.includes('--version')) {
  printVersionAndExit()
}

if (process.argv.includes('--help')) {
  printHelpAndExit()
}

const server = createServer({
  basePath: process.argv[2],
  httpPort: process.argv[3],
})
server.onStart(({ basePath, httpPort, urls }) => {
  printStartupInfo(basePath, httpPort, urls)
})
server.onResponse(({ requestedPath, requestedMethod, httpCode }) => {
  const methodColor = String(httpCode).startsWith('2') ? 'green' : 'red'
  log([
    color(requestedMethod, methodColor),
    color(httpCode, methodColor),
    requestedPath,
  ].join(' '))
})
server.onError((error) => {
  log(`A server error occurred: ${color(error.message, 'red')}`)
  process.exitCode = 1
})
server.start()
