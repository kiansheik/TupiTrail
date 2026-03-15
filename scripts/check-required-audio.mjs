#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import ts from 'typescript'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, '..')
const lessonsRoot = path.join(repoRoot, 'src', 'data', 'course', 'en')
const publicRoot = path.join(repoRoot, 'public')

const strict = process.argv.includes('--strict')

const walkFiles = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true })
  const out = []

  for (const entry of entries) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...walkFiles(full))
      continue
    }
    if (entry.isFile() && full.endsWith('.ts') && !full.endsWith('.d.ts')) {
      out.push(full)
    }
  }

  return out.sort()
}

const getPropName = (name) => {
  if (ts.isIdentifier(name)) {
    return name.text
  }
  if (ts.isStringLiteralLike(name)) {
    return name.text
  }
  return null
}

const getStringLiteral = (node) => {
  if (ts.isStringLiteralLike(node) || ts.isNoSubstitutionTemplateLiteral(node)) {
    return node.text
  }
  return null
}

const getBooleanLiteral = (node) => {
  if (node.kind === ts.SyntaxKind.TrueKeyword) {
    return true
  }
  if (node.kind === ts.SyntaxKind.FalseKeyword) {
    return false
  }
  return null
}

const toRepoAudioPath = (value) => {
  if (value.startsWith('/')) {
    return value
  }
  return `/audio/${value.replace(/^audio\//, '').replace(/^\/+/, '')}`
}

const parseRepoAudioOptions = (node) => {
  if (!node || !ts.isObjectLiteralExpression(node)) {
    return { required: true, slowSrc: null }
  }

  let required = true
  let slowSrc = null

  for (const prop of node.properties) {
    if (!ts.isPropertyAssignment(prop)) {
      continue
    }
    const name = getPropName(prop.name)
    if (!name) {
      continue
    }

    if (name === 'required') {
      const value = getBooleanLiteral(prop.initializer)
      if (value != null) {
        required = value
      }
    }

    if (name === 'slowSrc') {
      const value = getStringLiteral(prop.initializer)
      if (value) {
        slowSrc = toRepoAudioPath(value)
      }
    }
  }

  return { required, slowSrc }
}

const collectRequiredAudio = (rootDir) => {
  const files = walkFiles(rootDir)
  const required = new Map()

  const add = (src, fromFile) => {
    if (!src) {
      return
    }
    if (!required.has(src)) {
      required.set(src, fromFile)
    }
  }

  for (const filePath of files) {
    const source = fs.readFileSync(filePath, 'utf8')
    const sf = ts.createSourceFile(filePath, source, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS)

    const visit = (node) => {
      if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && node.expression.text === 'repoAudio') {
        const srcArg = node.arguments[0]
        const srcValue = srcArg ? getStringLiteral(srcArg) : null
        if (srcValue) {
          const options = parseRepoAudioOptions(node.arguments[1])
          if (options.required) {
            add(toRepoAudioPath(srcValue), filePath)
            if (options.slowSrc) {
              add(options.slowSrc, filePath)
            }
          }
        }
      }

      if (ts.isObjectLiteralExpression(node)) {
        let mode = null
        let src = null
        let requiredFlag = null
        let slowSrc = null

        for (const prop of node.properties) {
          if (!ts.isPropertyAssignment(prop)) {
            continue
          }
          const name = getPropName(prop.name)
          if (!name) {
            continue
          }

          if (name === 'mode') {
            mode = getStringLiteral(prop.initializer)
          }
          if (name === 'src') {
            src = getStringLiteral(prop.initializer)
          }
          if (name === 'slowSrc') {
            slowSrc = getStringLiteral(prop.initializer)
          }
          if (name === 'required') {
            requiredFlag = getBooleanLiteral(prop.initializer)
          }
        }

        if (mode === 'file' && src && requiredFlag !== false) {
          add(toRepoAudioPath(src), filePath)
          if (slowSrc) {
            add(toRepoAudioPath(slowSrc), filePath)
          }
        }
      }

      ts.forEachChild(node, visit)
    }

    visit(sf)
  }

  return required
}

const fileExistsForUrl = (audioUrlPath) => {
  const normalized = audioUrlPath.replace(/^\/+/, '')
  const fullPath = path.join(publicRoot, normalized)
  if (fs.existsSync(fullPath)) {
    return true
  }

  if (/\.mp3$/i.test(normalized)) {
    const oggPath = fullPath.replace(/\.mp3$/i, '.ogg')
    return fs.existsSync(oggPath)
  }

  if (/\.ogg$/i.test(normalized)) {
    const mp3Path = fullPath.replace(/\.ogg$/i, '.mp3')
    return fs.existsSync(mp3Path)
  }

  return false
}

const run = () => {
  const required = collectRequiredAudio(lessonsRoot)
  const rows = [...required.entries()].sort((a, b) => a[0].localeCompare(b[0]))
  const missing = rows.filter(([audioPath]) => !fileExistsForUrl(audioPath))

  console.log(`Required audio files: ${rows.length}`)
  if (rows.length > 0) {
    for (const [audioPath] of rows) {
      const status = fileExistsForUrl(audioPath) ? 'OK' : 'MISSING'
      console.log(`- [${status}] ${audioPath}`)
    }
  }

  if (missing.length > 0) {
    console.log('')
    console.log(`Missing required audio files: ${missing.length}`)
    for (const [audioPath, fromFile] of missing) {
      console.log(`  ${audioPath} (referenced in ${path.relative(repoRoot, fromFile)})`)
    }
  } else {
    console.log('')
    console.log('All required audio files are present.')
  }

  if (strict && missing.length > 0) {
    process.exitCode = 1
  }
}

run()
