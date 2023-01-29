const pkg = require('../package.json')
const os = require('os')

module.exports = {
  log,
  color,
  printVersionAndExit,
  printHelpAndExit,
  printStartupInfo,
  nameAndVersion,
}

const colors = {
  'black': '30',
  'red': '31',
  'green': '32',
  'brown': '33',
  'blue': '34',
  'purple': '35',
  'cyan': '36',
  'lightgray': '37',
}

function printVersionAndExit() {
  log(nameAndVersion())
  process.exit(0)
}

function printHelpAndExit() {
  const help = [
    '',
    nameAndVersion(),
    pkg.description,
    '',
    color('Usage', 'green'),
    'httpdir <path> <port>',
    '',
    color('Options', 'green'),
    '--version   Output current version',
    '--help      Output help',
    '',
  ]
  console.log(help.join('\n'))
  process.exit(0)
}

function printStartupInfo(basePath, httpPort) {
  console.log(`🚀 ${color(nameAndVersion(), 'purple')}`)
  console.log(`📁 ${color(basePath, 'cyan')}`)
  console.log(`🌎 http://${color('localhost', 'green')}:${httpPort}`)
  const nets = os.networkInterfaces()
  for (const name of Object.keys(nets)) {
    for (const net of nets[name]) {
      if (net.family === 'IPv4') {
        console.log(`🌎 http://${color(net.address, 'green')}:${httpPort}`)
      }
    }
  }
}

function log(message) {
  process.stdout.write(`${message}\n`)
}

function color(message, color) {
  const colorCode = colors[color] || '0'
  return `\x1b[${colorCode}m${message}\x1b[0m`
}

function nameAndVersion() {
  return `${pkg.name} ${pkg.version}`
}
