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
 * What it does:
 *   1. Extracts the zip
 *   2. Copies the .ts lesson file → src/data/course/en/{unitId}/{lessonId}.ts
 *   3. Copies audio files         → public/audio/{lessonId}/
 *   4. Copies image files          → public/images/{lessonId}/
 *   5. Adds lesson to manifest.json
 *   6. Regenerates course.ts from manifest
 *   7. Bumps APP_STORE_VERSION
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
import { generateCourse } from './generate-course.mjs'

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

info(`Lesson ID  : ${lessonId}`)
info(`Unit ID    : ${unitId}`)

// ─── 3. Copy .ts file ─────────────────────────────────────────────────────────

step('3. Copying lesson file…')

const unitDir = resolve(projectRoot, 'src/data/course/en', unitId)
mkdirSync(unitDir, { recursive: true })

const destTs = resolve(unitDir, tsFileName)
copyFileSync(resolve(tmpDir, tsFileName), destTs)
ok(`src/data/course/en/${unitId}/${tsFileName}`)

// ─── 4. Copy audio & image files ─────────────────────────────────────────────

step('4. Copying audio & image files…')

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

// ─── 5. Update manifest.json ─────────────────────────────────────────────────

step('5. Updating manifest.json…')

const manifestPath = resolve(projectRoot, 'src/data/course/en/manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))

const lessonPath = `${unitId}/${lessonId}`

if (manifest.lessons.includes(lessonPath)) {
  warn(`Manifest already contains '${lessonPath}' — will regenerate course.ts with updated file.`)
} else {
  manifest.lessons.push(lessonPath)
  ok(`Added '${lessonPath}' to lessons`)
}

// Add unit if new
if (!manifest.units.some((u) => u.id === unitId)) {
  const unitTitle = unitId.replace(/^unit(\d+)$/i, (_, n) => `Unit ${n}`)
  manifest.units.push({ id: unitId, title: unitTitle })
  ok(`Added unit '${unitId}' (title: '${unitTitle}')`)
  info(`To change the unit title, edit manifest.json and run: make generate-course`)
}

writeFileSync(manifestPath, JSON.stringify(manifest, null, 2) + '\n')

// ─── 6. Generate course.ts ───────────────────────────────────────────────────

step('6. Generating course.ts…')

const result = generateCourse()
ok(`Generated — ${result.lessons.length} lesson(s), ${result.unitOrder.length} unit(s)`)

// ─── 7. Bump APP_STORE_VERSION ───────────────────────────────────────────────

step('7. Bumping APP_STORE_VERSION…')

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

// ─── 8. Clean up temp dir ─────────────────────────────────────────────────────

rmSync(tmpDir, { recursive: true, force: true })

console.log(`\n${GREEN}${BOLD}Import complete!${RESET} Run ${CYAN}make build${RESET} to verify.\n`)
