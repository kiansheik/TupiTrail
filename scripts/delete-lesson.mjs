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
 *   1. Entry from manifest.json (+ empty unit cleanup)
 *   2. src/data/course/en/{unitId}/{lessonId}.ts
 *   3. public/audio/{lessonId}/  (if exists)
 *   4. public/images/{lessonId}/ (if exists)
 *   5. Regenerates course.ts
 *   6. Bumps APP_STORE_VERSION
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
import { generateCourse } from './generate-course.mjs'

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

// ─── 1. Update manifest.json ─────────────────────────────────────────────────

step('1. Updating manifest.json…')

const manifestPath = resolve(projectRoot, 'src/data/course/en/manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

// Match by exact path (e.g. "unit1/unit1-tembi-u") or by lesson name (e.g. "unit1-tembi-u")
let lessonIdx = manifest.lessons.indexOf(lessonId)
if (lessonIdx === -1) {
  const matches = manifest.lessons.filter((p) => p.endsWith(`/${lessonId}`))
  if (matches.length === 1) {
    lessonIdx = manifest.lessons.indexOf(matches[0])
  } else if (matches.length > 1) {
    err(`Ambiguous lesson '${lessonId}' — found in multiple units:`)
    for (const m of matches) info(`  ${m}`)
    info(`Use the full path: make delete-lesson LESSON=${matches[0]}`)
    process.exit(1)
  }
}
if (lessonIdx === -1) {
  err(`Lesson '${lessonId}' not found in manifest.json`)
  info(`Available lessons: ${manifest.lessons.join(', ')}`)
  process.exit(1)
}

const lessonPath = manifest.lessons[lessonIdx]
const unitId = lessonPath.split('/')[0]

manifest.lessons.splice(lessonIdx, 1)
ok(`Removed '${lessonPath}' from manifest.lessons`)

// Remove unit if no more lessons reference it
const unitStillUsed = manifest.lessons.some((p) => p.startsWith(unitId + '/'))
if (!unitStillUsed) {
  manifest.units = manifest.units.filter((u) => u.id !== unitId)
  ok(`Removed empty unit '${unitId}' from manifest`)
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

// ─── 2. Delete lesson file ───────────────────────────────────────────────────

step('2. Deleting lesson file…')

const lessonFile = resolve(projectRoot, 'src/data/course/en', lessonPath + '.ts')
if (existsSync(lessonFile)) {
  rmSync(lessonFile)
  ok(`Deleted src/data/course/en/${lessonPath}.ts`)
} else {
  warn(`File not found: src/data/course/en/${lessonPath}.ts`)
}

// ─── 3. Delete audio & image folders ─────────────────────────────────────────

step('3. Deleting audio & image files…')

const audioDir = resolve(projectRoot, 'public/audio', lessonId)
if (existsSync(audioDir)) {
  const count = readdirSync(audioDir).length
  rmSync(audioDir, { recursive: true, force: true })
  ok(`Deleted public/audio/${lessonId}/ (${count} file${count !== 1 ? 's' : ''})`)
} else {
  info('No audio folder — skipping.')
}

const imagesDir = resolve(projectRoot, 'public/images', lessonId)
if (existsSync(imagesDir)) {
  const count = readdirSync(imagesDir).length
  rmSync(imagesDir, { recursive: true, force: true })
  ok(`Deleted public/images/${lessonId}/ (${count} file${count !== 1 ? 's' : ''})`)
} else {
  info('No images folder — skipping.')
}

// ─── 4. Regenerate course.ts ─────────────────────────────────────────────────

step('4. Generating course.ts…')

const result = generateCourse()
ok(`Generated — ${result.lessons.length} lesson(s), ${result.unitOrder.length} unit(s)`)

// ─── 5. Bump APP_STORE_VERSION ───────────────────────────────────────────────

step('5. Bumping APP_STORE_VERSION…')

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

// ─── Done ─────────────────────────────────────────────────────────────────────

console.log(`\n${GREEN}${BOLD}Lesson '${lessonId}' deleted.${RESET} Run ${CYAN}make build${RESET} to verify.\n`)
