#!/usr/bin/env node
/**
 * import-lesson.mjs
 *
 * Imports a lesson .zip exported by the Tupi Trail Lesson Builder into the
 * project source tree.
 *
 * Usage:
 *   node scripts/import-lesson.mjs <path/to/lesson.zip>
 *   make import-lesson ZIP=~/Downloads/unit1-lesson2.zip
 *
 * What it does automatically:
 *   1. Extracts the zip
 *   2. Copies the .ts lesson file → src/data/course/en/{unitId}/{lessonId}.ts
 *   3. Copies audio files         → public/audio/{lessonId}/
 *   4. Patches course.ts          → adds import + materializeLesson call
 *
 * What it prints as a manual step:
 *   - The exact line to add to the lessons array in course.ts
 *   - The path node block to add to pathNodesSeed
 */

import { execSync } from 'child_process'
import {
  readFileSync,
  writeFileSync,
  mkdirSync,
  readdirSync,
  copyFileSync,
  existsSync,
  rmSync,
} from 'fs'
import { resolve, dirname } from 'path'
import { tmpdir } from 'os'
import { fileURLToPath } from 'url'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const RESET  = '\x1b[0m'
const BOLD   = '\x1b[1m'
const GREEN  = '\x1b[32m'
const YELLOW = '\x1b[33m'
const CYAN   = '\x1b[36m'
const RED    = '\x1b[31m'


const ok   = (msg) => console.log(`${GREEN}✓${RESET} ${msg}`)
const warn = (msg) => console.log(`${YELLOW}⚠${RESET}  ${msg}`)
const info = (msg) => console.log(`${CYAN}ℹ${RESET}  ${msg}`)
const err  = (msg) => console.error(`${RED}✗${RESET} ${msg}`)
const step = (msg) => console.log(`\n${BOLD}${msg}${RESET}`)

// ─── Args ─────────────────────────────────────────────────────────────────────

const zipPath = process.argv[2]
if (!zipPath) {
  err('No zip file provided.')
  console.error(`\n  Usage: make import-lesson ZIP=path/to/lesson.zip\n`)
  process.exit(1)
}

const zipAbs = resolve(zipPath)
if (!existsSync(zipAbs)) {
  err(`File not found: ${zipAbs}`)
  process.exit(1)
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ─── 1. Extract zip ───────────────────────────────────────────────────────────

step('1. Extracting zip…')

const tmpDir = resolve(tmpdir(), `tupi-import-${Date.now()}`)
mkdirSync(tmpDir, { recursive: true })

try {
  execSync(`unzip -q "${zipAbs}" -d "${tmpDir}"`, { stdio: 'inherit' })
} catch {
  err('unzip failed. Make sure `unzip` is installed (brew install unzip).')
  process.exit(1)
}

// ─── 2. Read the .ts lesson file ──────────────────────────────────────────────

step('2. Reading lesson metadata…')

const tsFiles = readdirSync(tmpDir).filter((f) => f.endsWith('.ts') && f !== 'README.md')
if (!tsFiles.length) {
  err('No .ts file found in zip.')
  process.exit(1)
}

const tsFileName = tsFiles[0]
const lessonId   = tsFileName.replace(/\.ts$/, '')
const tsContent  = readFileSync(resolve(tmpDir, tsFileName), 'utf8')

// Extract unitId
const unitIdMatch = tsContent.match(/unitId:\s*'([^']+)'/)
if (!unitIdMatch) {
  err('Could not parse unitId from the lesson file.')
  process.exit(1)
}
const unitId = unitIdMatch[1]

// Extract exported variable name
const varNameMatch = tsContent.match(/export const (\w+)/)
if (!varNameMatch) {
  err('Could not find export in lesson file.')
  process.exit(1)
}
const templateVar = varNameMatch[1]
// Derive a clean lesson variable (strip _template suffix)
const lessonVar   = templateVar.replace(/_template$/, '')

info(`Lesson ID  : ${lessonId}`)
info(`Unit ID    : ${unitId}`)
info(`Export var : ${templateVar}`)

// ─── 3. Copy .ts file ─────────────────────────────────────────────────────────

step('3. Copying lesson file…')

const unitDir = resolve(projectRoot, 'src/data/course/en', unitId)
mkdirSync(unitDir, { recursive: true })

const destTs = resolve(unitDir, tsFileName)
copyFileSync(resolve(tmpDir, tsFileName), destTs)
ok(`src/data/course/en/${unitId}/${tsFileName}`)

// ─── 4. Copy audio files ──────────────────────────────────────────────────────

step('4. Copying audio files…')

const audioSrcDir = resolve(tmpDir, 'audio')
if (existsSync(audioSrcDir)) {
  const audioDestDir = resolve(projectRoot, 'public/audio', lessonId)
  mkdirSync(audioDestDir, { recursive: true })
  const audioFiles = readdirSync(audioSrcDir)
  for (const f of audioFiles) {
    copyFileSync(resolve(audioSrcDir, f), resolve(audioDestDir, f))
  }
  ok(`public/audio/${lessonId}/ (${audioFiles.length} file${audioFiles.length !== 1 ? 's' : ''})`)
} else {
  info('No audio/ folder in zip — skipping.')
}

// ─── 4b. Copy image files ─────────────────────────────────────────────────────

const imageSrcDir = resolve(tmpDir, 'images')
if (existsSync(imageSrcDir)) {
  const imageDestDir = resolve(projectRoot, 'public/images', lessonId)
  mkdirSync(imageDestDir, { recursive: true })
  const imageFiles = readdirSync(imageSrcDir)
  for (const f of imageFiles) {
    copyFileSync(resolve(imageSrcDir, f), resolve(imageDestDir, f))
  }
  ok(`public/images/${lessonId}/ (${imageFiles.length} file${imageFiles.length !== 1 ? 's' : ''})`)
}

// ─── 5. Patch course.ts ───────────────────────────────────────────────────────

step('5. Patching src/data/course/en/course.ts…')

const courseTsPath = resolve(projectRoot, 'src/data/course/en/course.ts')
let src = readFileSync(courseTsPath, 'utf8')

const alreadyImported = src.includes(templateVar)

if (alreadyImported) {
  warn(`course.ts already references '${templateVar}' — skipping import/materialize patch.`)
} else {
  // 5a. Insert import after the last import line
  const importLine = `import { ${templateVar} } from '@/data/course/en/${unitId}/${lessonId}'`
  const lastImportMatch = [...src.matchAll(/^import .+from .+$/gm)].at(-1)
  if (lastImportMatch) {
    const insertAt = lastImportMatch.index + lastImportMatch[0].length
    src = src.slice(0, insertAt) + '\n' + importLine + src.slice(insertAt)
  } else {
    src = importLine + '\n' + src
  }

  // 5b. Insert materializeLesson call after the last such call
  const matLine = `const ${lessonVar} = materializeLesson(${templateVar})`
  const lastMatMatch = [...src.matchAll(/^const \w+ = materializeLesson\(.+\)$/gm)].at(-1)
  if (lastMatMatch) {
    const insertAt = lastMatMatch.index + lastMatMatch[0].length
    src = src.slice(0, insertAt) + '\n' + matLine + src.slice(insertAt)
  } else {
    src = src.replace('export const courseEn', `${matLine}\nexport const courseEn`)
  }

  ok('Added import + materializeLesson call')
}

// 5c. Add to the correct unit's lessons array (create the unit if it doesn't exist)
{
  const unitMarker = `id: '${unitId}'`
  const markerIdx = src.indexOf(unitMarker)

  if (markerIdx === -1) {
    // Unit doesn't exist — create it inside the units: [...] array
    const unitsMarker = 'units: ['
    const unitsIdx = src.indexOf(unitsMarker)
    if (unitsIdx === -1) {
      warn(`Could not find 'units: [' in course.ts — add unit '${unitId}' manually.`)
    } else {
      // Bracket-count to find closing ] of units array
      let depth = 0
      let pos = unitsIdx + unitsMarker.length - 1  // start at [
      while (pos < src.length) {
        if (src[pos] === '[') depth++
        else if (src[pos] === ']') { depth--; if (depth === 0) break }
        pos++
      }
      // Derive a human-readable title from unitId (e.g. unit2 → "Unit 2")
      const unitTitle = unitId.replace(/^unit(\d+)$/i, (_, n) => `Unit ${n}`)
      const newUnitBlock = `    {\n      id: '${unitId}',\n      title: '${unitTitle}',\n      lessons: [${lessonVar}],\n    },\n`
      src = src.slice(0, pos) + newUnitBlock + src.slice(pos)
      ok(`Created unit '${unitId}' in courseEn with '${lessonVar}'`)
    }
  } else {
    // Unit exists — walk back to { and forward to } to get the unit object block
    let objStart = markerIdx
    while (objStart > 0 && src[objStart] !== '{') objStart--

    let depth = 0
    let objEnd = objStart
    while (objEnd < src.length) {
      if (src[objEnd] === '{') depth++
      else if (src[objEnd] === '}') { depth--; if (depth === 0) break }
      objEnd++
    }

    const unitBlock = src.slice(objStart, objEnd + 1)

    if (unitBlock.includes(lessonVar)) {
      warn(`Unit '${unitId}' lessons array already contains '${lessonVar}' — skipping.`)
    } else {
      const patched = unitBlock.replace(/(lessons:\s*\[)([\s\S]*?)(\])/,
        (_, open, inner, close) => {
          const trimmed = inner.trimEnd()
          const sep = trimmed.endsWith(',') ? '' : (trimmed.length ? ',' : '')
          return `${open}${trimmed}${sep} ${lessonVar}${close}`
        })
      src = src.slice(0, objStart) + patched + src.slice(objEnd + 1)
      ok(`Added '${lessonVar}' to unit '${unitId}' lessons array`)
    }
  }
}

// 5d. Add to pathNodesSeed (append a new node before the closing ] of pathNodesSeed)
let addedPathNode = false
if (src.includes(`lessonId: '${lessonId}'`)) {
  warn(`pathNodesSeed already has a node for '${lessonId}' — skipping.`)
} else {
  // Count existing nodes to determine next node number and y position
  const existingNodes = [...src.matchAll(/id:\s*'node-(\d+)'/g)]
  const nextNodeNum = existingNodes.length + 1
  // Determine last y value to space new node below
  const yMatches = [...src.matchAll(/y:\s*(-?\d+)/g)]
  const lastY = yMatches.length ? parseInt(yMatches.at(-1)[1]) : 0
  const newY = lastY + 96
  // Alternating x pattern: odd nodes lean right (+18), even lean left (-28)
  const newX = nextNodeNum % 2 === 0 ? -28 : 18

  const nodeBlock = `  {
    id: 'node-${nextNodeNum}',
    unitId: '${unitId}',
    lessonId: '${lessonId}',
    x: ${newX},
    y: ${newY},
    type: 'lesson',
    unlocked: false,
    completed: false,
  },`

  // Insert before the closing ] of pathNodesSeed array
  src = src.replace(/(export const pathNodesSeed[^=]*=\s*\[)([\s\S]*?)(\n\])/,
    (_, open, body, close) => `${open}${body}\n${nodeBlock}${close}`)
  ok(`Added node-${nextNodeNum} to pathNodesSeed (y=${newY})`)
  addedPathNode = true
}

writeFileSync(courseTsPath, src)

// ─── 6. Bump APP_STORE_VERSION so browsers re-run the path migration ───────────

if (addedPathNode) {
  step('6. Bumping APP_STORE_VERSION…')
  const migrationsTsPath = resolve(projectRoot, 'src/store/migrations.ts')
  let migSrc = readFileSync(migrationsTsPath, 'utf8')
  const versionMatch = migSrc.match(/APP_STORE_VERSION = (\d+)/)
  if (versionMatch) {
    const nextVersion = parseInt(versionMatch[1]) + 1
    migSrc = migSrc
      .replace(/APP_STORE_VERSION = \d+/, `APP_STORE_VERSION = ${nextVersion}`)
      .replace(/if \(version < \d+\)/, `if (version < ${nextVersion})`)
    writeFileSync(migrationsTsPath, migSrc)
    ok(`APP_STORE_VERSION → ${nextVersion}`)
  } else {
    warn('Could not parse APP_STORE_VERSION — bump it manually in src/store/migrations.ts')
  }
}

// ─── 7. Clean up temp dir ─────────────────────────────────────────────────────

rmSync(tmpDir, { recursive: true, force: true })

console.log(`\n${GREEN}${BOLD}Import complete!${RESET} Run ${CYAN}npm run build${RESET} or ${CYAN}make build${RESET} to verify.\n`)
