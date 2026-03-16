#!/usr/bin/env node
/**
 * delete-lesson.mjs
 *
 * Cleanly removes a lesson from the project.
 *
 * Usage:
 *   node scripts/delete-lesson.mjs <lessonId>
 *   make delete-lesson LESSON=unit1-my-lesson
 *
 * What it removes:
 *   1. src/data/course/en/{unitId}/{lessonId}.ts
 *   2. public/audio/{lessonId}/  (if exists)
 *   3. public/images/{lessonId}/ (if exists)
 *   4. course.ts patches:
 *      - import line
 *      - materializeLesson call
 *      - entry in lessons array
 *      - node in pathNodesSeed
 */

import {
  existsSync,
  readFileSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

// ─── Colours ──────────────────────────────────────────────────────────────────

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

const lessonId = process.argv[2]
if (!lessonId) {
  err('No lesson ID provided.')
  console.error(`\n  Usage: make delete-lesson LESSON=unit1-my-lesson\n`)
  process.exit(1)
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ─── 1. Find the lesson file ──────────────────────────────────────────────────

step('1. Locating lesson file…')

const unitDirsRoot = resolve(projectRoot, 'src/data/course/en')
let lessonFilePath = null
let unitId = null

const unitDirs = readdirSync(unitDirsRoot, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)

for (const dir of unitDirs) {
  const candidate = resolve(unitDirsRoot, dir, `${lessonId}.ts`)
  if (existsSync(candidate)) {
    lessonFilePath = candidate
    unitId = dir
    break
  }
}

if (!lessonFilePath) {
  err(`Lesson file not found for ID '${lessonId}' in any unit directory.`)
  err(`Searched: ${unitDirs.map((d) => `src/data/course/en/${d}/${lessonId}.ts`).join(', ')}`)
  process.exit(1)
}

info(`Found: src/data/course/en/${unitId}/${lessonId}.ts`)

// ─── 2. Read the lesson file to get the export variable name ─────────────────

step('2. Reading lesson metadata…')

const tsContent = readFileSync(lessonFilePath, 'utf8')
const varNameMatch = tsContent.match(/export const (\w+)/)
if (!varNameMatch) {
  err('Could not find export const in lesson file.')
  process.exit(1)
}
const templateVar = varNameMatch[1]
const lessonVar = templateVar.replace(/_template$/, '')

info(`Template var : ${templateVar}`)
info(`Lesson var   : ${lessonVar}`)

// ─── 3. Delete the lesson .ts file ───────────────────────────────────────────

step('3. Deleting lesson file…')

rmSync(lessonFilePath)
ok(`Deleted src/data/course/en/${unitId}/${lessonId}.ts`)

// ─── 4. Delete audio folder ───────────────────────────────────────────────────

step('4. Deleting audio files…')

const audioDir = resolve(projectRoot, 'public/audio', lessonId)
if (existsSync(audioDir)) {
  const count = readdirSync(audioDir).length
  rmSync(audioDir, { recursive: true, force: true })
  ok(`Deleted public/audio/${lessonId}/ (${count} file${count !== 1 ? 's' : ''})`)
} else {
  info('No public/audio/{lessonId}/ folder — skipping.')
}

// ─── 5. Delete images folder ──────────────────────────────────────────────────

step('5. Deleting image files…')

const imagesDir = resolve(projectRoot, 'public/images', lessonId)
if (existsSync(imagesDir)) {
  const count = readdirSync(imagesDir).length
  rmSync(imagesDir, { recursive: true, force: true })
  ok(`Deleted public/images/${lessonId}/ (${count} file${count !== 1 ? 's' : ''})`)
} else {
  info('No public/images/{lessonId}/ folder — skipping.')
}

// ─── 6. Patch course.ts ───────────────────────────────────────────────────────

step('6. Patching src/data/course/en/course.ts…')

const courseTsPath = resolve(projectRoot, 'src/data/course/en/course.ts')
let src = readFileSync(courseTsPath, 'utf8')

// 6a. Remove import line
const importPattern = new RegExp(`^import \\{ ${templateVar} \\} from '[^']+'\n`, 'm')
if (importPattern.test(src)) {
  src = src.replace(importPattern, '')
  ok(`Removed import { ${templateVar} }`)
} else {
  warn(`Import line for '${templateVar}' not found — skipping.`)
}

// 6b. Remove materializeLesson call
const matPattern = new RegExp(`^const ${lessonVar} = materializeLesson\\(${templateVar}\\)\n`, 'm')
if (matPattern.test(src)) {
  src = src.replace(matPattern, '')
  ok(`Removed const ${lessonVar} = materializeLesson(…)`)
} else {
  warn(`materializeLesson call for '${lessonVar}' not found — skipping.`)
}

// 6c. Remove from lessons array — handles ", lessonVar" or "lessonVar," or "lessonVar" alone
const inLessons = new RegExp(`,?\\s*\\b${lessonVar}\\b\\s*,?`)
// We need to be careful not to remove both commas. Strategy: find the unit block, patch within it.
const unitMarker = `id: '${unitId}'`
const markerIdx = src.indexOf(unitMarker)
if (markerIdx === -1) {
  warn(`Unit '${unitId}' not found in course.ts — could not remove from lessons array.`)
} else {
  let objStart = markerIdx
  while (objStart > 0 && src[objStart] !== '{') objStart--
  let depth = 0, objEnd = objStart
  while (objEnd < src.length) {
    if (src[objEnd] === '{') depth++
    else if (src[objEnd] === '}') { depth--; if (depth === 0) break }
    objEnd++
  }
  const unitBlock = src.slice(objStart, objEnd + 1)

  if (!unitBlock.includes(lessonVar)) {
    warn(`'${lessonVar}' not found in unit '${unitId}' lessons array — skipping.`)
  } else {
    // Remove "lessonVar," or ", lessonVar" or just "lessonVar" if it's the only one
    let patched = unitBlock
      .replace(new RegExp(`\\b${lessonVar}\\b,\\s*`), '')   // "lessonVar, "
      .replace(new RegExp(`,\\s*\\b${lessonVar}\\b`), '')   // ", lessonVar"
      .replace(new RegExp(`\\b${lessonVar}\\b`), '')         // lone entry
    src = src.slice(0, objStart) + patched + src.slice(objEnd + 1)
    ok(`Removed '${lessonVar}' from unit '${unitId}' lessons array`)
  }
}

// 6d. Remove pathNodesSeed node block
const nodeSeedPattern = new RegExp(
  `\\s*\\{[^}]*lessonId:\\s*'${lessonId}'[^}]*\\},?`,
  's'
)
if (nodeSeedPattern.test(src)) {
  src = src.replace(nodeSeedPattern, '')
  ok(`Removed pathNodesSeed node for '${lessonId}'`)
} else {
  warn(`No pathNodesSeed node found for '${lessonId}' — skipping.`)
}

writeFileSync(courseTsPath, src)

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log(`\n${GREEN}${BOLD}Lesson '${lessonId}' deleted.${RESET} Run ${CYAN}make build${RESET} to verify.\n`)
