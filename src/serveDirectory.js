const fsp = require('fs').promises
const path = require('path')
const { nameAndVersion } = require('./log.js')
const pkg = require('../package.json')

module.exports = {
  serveDirectory,
}

/**
 * Serve a directory (HTML template with a list of files and current directory parts)
 */
async function serveDirectory({ basePath, requestedPath, response }) {
  const dirPath = path.join(basePath, requestedPath)
  const dirTemplate = await loadDirTemplate()
  const filesList = await getFilesList({ dirPath, withBackLink: requestedPath !== '/' })
  response.writeHead(200, {
    'Content-Type': 'text/html',
    'Cache-Control': 'no-cache, no-store',
    'X-Served-By': nameAndVersion(),
  })
  response.end(renderTemplate(dirTemplate, {
    dirPath,
    pathParts: getPathParts({ basePath, requestedPath }),
    filesList,
    footerText: nameAndVersion(),
    footerLink: pkg.repository.url,
  }))
}

/**
 * Split the requested path in distinct directories with its name and a link
 * Prepend the base path to the resulting list
 */
function getPathParts({ basePath, requestedPath }) {
  const rawParts = requestedPath.replace(/(^\/|\/$)/g, '').split('/').filter((part) => part !== '')
  const parts = [{ name: basePath, href: '/' }]
  rawParts.forEach((part, index) => {
    parts.push({
      name: part,
      href: '../'.repeat(rawParts.length - index) + part + (part !== '' ? '/' : ''),
    })
  })
  return parts
}

/**
 * Get a list of files with name and link from a directory
 * Prepend a link to the parent directory if needed
 */
async function getFilesList({ dirPath, withBackLink }) {
  const files = await fsp.readdir(dirPath)
  const list = []
  if (withBackLink) {
    list.push({  href: '../', name: '..', type: 'dir' })
  }
  for(let index = 0; index < files.length; index += 1) {
    const stat = await fsp.stat(path.join(dirPath, files[index]))
    const type = stat.isDirectory() ? 'dir' : 'file'
    const href = files[index] + (stat.isDirectory() ? '/' : '')
    list.push({ href, name: files[index], type })
  }
  return list
}

/**
 * Render the given template with the <% %> syntax
 */
function renderTemplate(template, data) {
  let templateCursor = 0
  let templateCommands = 'const parts=[]\n'
  const templateTagRegex = /<%([-=]?)([^%>]+)%>/g
  let match = null
  // Look for template tags in the input template
  while(match = templateTagRegex.exec(template)) {
    // Add the raw template between the last cursor to the beginning of the current match
    templateCommands += 'parts.push(`' + template.slice(templateCursor, match.index) + '`)\n'
    // Add an unencoded variable (<%-), an HTML encoded variable (<%=), or a raw JS instruction (<%)
    if (match[1] === '-') {
      templateCommands += 'parts.push(' + match[2] + ')\n'
    }
    else if (match[1] === '=') {
      templateCommands += 'parts.push(htmlEntities(' + match[2] + '))\n'
    }
    else {
      templateCommands += match[2]
    }
    // Move the cursor right after the current match
    templateCursor = match.index + match[0].length
  }
  // Add the end of the raw template & apply the input data to the generated commands
  templateCommands += 'parts.push(`' + template.substr(templateCursor) + '`)\n'
  templateCommands += 'return parts.join(``)'
  return new Function('data', 'htmlEntities', templateCommands)(data, htmlEntities)
}

function htmlEntities(str) {
  str = str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
  str = str.replace(/&/g, '&amp;').replace(/"/g, '&quot;')
  return str
}

/**
 * Load the required assets at runtime for easier development
 * - Base placeholders (CSS, etc) are replaced there
 * - Dynamic data from the current directory is rendered by renderTemplate()
 */
async function loadDirTemplate() {
  let html = await fsp.readFile(path.join(__dirname, './ui/dir.html'), 'utf8')
  const css = await fsp.readFile(path.join(__dirname, './ui/dir.css'), 'utf8')
  const js = await fsp.readFile(path.join(__dirname, './ui/dir.js'), 'utf8')
  const bitmapDir = await fsp.readFile(path.join(__dirname, './ui/dir.png'))
  const base64Dir = Buffer.from(bitmapDir).toString('base64')
  const bitmapFile = await fsp.readFile(path.join(__dirname, './ui/file.png'))
  const base64File = Buffer.from(bitmapFile).toString('base64')
  html = html.replace('{{ css }}', css)
  html = html.replace('{{ js }}', js)
  html = html.replace('{{ cssBase64Dir }}', base64Dir)
  html = html.replace('{{ cssBase64File }}', base64File)
  return html
}
