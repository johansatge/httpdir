import { promises as fsp } from 'fs'
import path from 'path'
import pkg from '../package.json' with { type: 'json' }
import { nameAndVersion } from './log.js'

export {
  serveDirectory,
}

let cachedDirTemplate = null

/**
 * Serve a directory (HTML template with a list of files and current directory parts)
 */
async function serveDirectory({ basePath, requestedPath, response }) {
  const dirPath = path.join(basePath, requestedPath)
  const [dirTemplate, filesList] = await Promise.all([
    loadDirTemplate(),
    getFilesList({ dirPath, withBackLink: requestedPath !== '/' }),
  ])
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
  return { httpCode: 200 }
}

/**
 * Split the requested path in distinct directories with its name and a link
 * Prepend the base path to the resulting list
 */
function getPathParts({ basePath, requestedPath }) {
  const rawParts = requestedPath.replace(/(^\/|\/$)/g, '').split('/').filter((part) => part !== '')
  const parts = [{ name: basePath, href: '/' }]
  rawParts.forEach((part, index) => {
    const encodedPart = encodeURIComponent(part)
    parts.push({
      name: part,
      href: '../'.repeat(rawParts.length - index) + encodedPart + (part !== '' ? '/' : ''),
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
  const fileEntries = await Promise.all(files.map(async (file) => {
    const stat = await fsp.stat(path.join(dirPath, file))
    const type = stat.isDirectory() ? 'dir' : 'file'
    const href = encodeURIComponent(file) + (stat.isDirectory() ? '/' : '')
    return { href, name: file, type }
  }))
  const list = withBackLink ? [{ href: '../', name: '..', type: 'dir' }] : []
  return list.concat(fileEntries)
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
  str = str.replace(/&/g, '&amp;')
  str = str.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
  return str
}

/**
 * Load the required assets at runtime for easier development
 * - Base placeholders (CSS, etc) are replaced there
 * - Dynamic data from the current directory is rendered by renderTemplate()
 */
async function loadDirTemplate() {
  if (cachedDirTemplate) return cachedDirTemplate
  const [html, css, js, bitmapDir, bitmapFile] = await Promise.all([
    fsp.readFile(path.join(import.meta.dirname, './ui/dir.html'), 'utf8'),
    fsp.readFile(path.join(import.meta.dirname, './ui/dir.css'), 'utf8'),
    fsp.readFile(path.join(import.meta.dirname, './ui/dir.js'), 'utf8'),
    fsp.readFile(path.join(import.meta.dirname, './ui/dir.png')),
    fsp.readFile(path.join(import.meta.dirname, './ui/file.png')),
  ])
  cachedDirTemplate = html
    .replace('{{ css }}', css)
    .replace('{{ js }}', js)
    .replace('{{ cssBase64Dir }}', Buffer.from(bitmapDir).toString('base64'))
    .replace('{{ cssBase64File }}', Buffer.from(bitmapFile).toString('base64'))
  return cachedDirTemplate
}
