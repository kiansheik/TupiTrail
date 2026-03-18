#!/usr/bin/env node
/**
 * export-lesson.mjs
 *
 * Exports a lesson from the codebase back into builder ZIP format.
 * Useful when you've hand-edited a .ts lesson file and want to
 * re-import it into the builder UI or share it as a .zip bundle.
 *
 * Usage:
 *   node scripts/export-lesson.mjs <lessonId>
 *   make export-lesson LESSON=unit1-tembi-u
 *
 * Output:
 *   ./<lessonId>.zip in the current working directory
 */

import {
  readFileSync,
  readdirSync,
  existsSync,
  writeFileSync,
} from 'fs'
import { resolve, dirname, join } from 'path'
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

const args = process.argv.slice(2)
const outDirIdx = args.indexOf('--out-dir')
let outDir = process.cwd()
if (outDirIdx !== -1) {
  outDir = resolve(args[outDirIdx + 1] ?? '.')
  args.splice(outDirIdx, 2)
}

const lessonId = args[0]
if (!lessonId) {
  err('No lesson ID provided.')
  console.error(`\n  Usage: make export-lesson LESSON=unit1-tembi-u [OUT_DIR=./exports]\n`)
  process.exit(1)
}

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..')

// ─── 1. Find the lesson file via manifest ─────────────────────────────────────

step('1. Locating lesson file…')

const manifestPath = resolve(projectRoot, 'src/data/course/en/manifest.json')
const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'))
const lessonEntry = manifest.lessons.find((l) => l.endsWith(lessonId))

if (!lessonEntry) {
  err(`Lesson "${lessonId}" not found in manifest.json`)
  info(`Available lessons: ${manifest.lessons.join(', ')}`)
  process.exit(1)
}

const tsFilePath = resolve(projectRoot, 'src/data/course/en', `${lessonEntry}.ts`)
if (!existsSync(tsFilePath)) {
  err(`File not found: ${tsFilePath}`)
  process.exit(1)
}

const tsCode = readFileSync(tsFilePath, 'utf8')
ok(`Found: src/data/course/en/${lessonEntry}.ts`)

// ─── 2. Parse the .ts file into a plain JS object ─────────────────────────────

step('2. Parsing lesson template…')

// Provide stubs for the imported functions
const repoAudio = (src, opts) => ({
  mode: 'file',
  src: String(src),
  id: opts?.id ?? '',
  required: opts?.required ?? true,
})
const enText = (v) => String(v)
const ptBrText = (v) => String(v)
const tupiText = (v) => String(v)

let code = tsCode
  // Strip import lines
  .replace(/^import\s+.*$/gm, '')
  // Strip type annotation on the export
  .replace(/:\s*LessonTemplateData\s*=/g, ' =')
  // Convert `export const xxx_template =` to `return`
  .replace(/^export\s+const\s+\w+\s*=/m, 'return')

// Evaluate with stubs as parameters
let template
try {
  template = new Function(
    'repoAudio', 'enText', 'ptBrText', 'tupiText',
    code,
  )(repoAudio, enText, ptBrText, tupiText)
} catch (e) {
  err(`Failed to parse lesson file: ${e.message}`)
  info('The .ts file may use syntax this script cannot eval. Check for unsupported imports.')
  process.exit(1)
}

ok(`Parsed: "${template.title}" (${template.exercises.length} exercises)`)

// ─── 3. Convert LessonTemplateData → BuilderLesson ────────────────────────────

step('3. Converting to builder format…')

const resolveStr = (v) => (typeof v === 'string' ? v : v?.value ?? '')

function convertAudio(audio) {
  if (!audio) return undefined
  if (audio.mode === 'file') return { id: audio.id, mode: 'file', src: audio.src }
  return undefined
}

function convertSegments(segs) {
  if (!segs?.length) return undefined
  return segs.map((s) => ({
    text: resolveStr(s.text),
    ...(s.highlight ? { highlight: s.highlight } : {}),
  }))
}

function convertExercise(ex) {
  const base = {
    id: ex.id,
    type: ex.type,
    instruction: ex.instruction ?? '',
    ...(ex.newWordBadge ? { newWordBadge: true } : {}),
    ...(ex.character ? { characterId: ex.character.id, characterMood: ex.character.mood } : {}),
    ...(ex.audio ? { audio: convertAudio(ex.audio) } : {}),
    ...(ex.slowAudio ? { slowAudio: convertAudio(ex.slowAudio) } : {}),
    ...(ex.meaning != null ? { meaning: ex.meaning } : {}),
    ...(ex.xp != null ? { xp: ex.xp } : {}),
    ...(ex.explanation ? { explanation: ex.explanation } : {}),
  }

  switch (ex.type) {
    case 'select_image':
      return {
        ...base,
        prompt: resolveStr(ex.prompt),
        options: ex.options.map((o) => ({
          id: o.id,
          label: resolveStr(o.label),
          imageEmoji: o.imageEmoji ?? '',
        })),
        correctOptionId: ex.correctOptionId,
      }
    case 'token_translate':
      return {
        ...base,
        sourceText: convertSegments(ex.sourceText) ?? [],
        ...(ex.promptSegments ? { promptSegments: convertSegments(ex.promptSegments) } : {}),
        tokenBank: ex.tokenBank.map(resolveStr),
        correctSequence: ex.correctSequence.map(resolveStr),
      }
    case 'multiple_choice_translation':
      return {
        ...base,
        prompt: resolveStr(ex.prompt),
        ...(ex.promptSegments ? { promptSegments: convertSegments(ex.promptSegments) } : {}),
        choices: ex.choices.map(resolveStr),
        correctChoice: resolveStr(ex.correctChoice),
      }
    case 'dialogue_choice':
      return {
        ...base,
        dialogue: ex.dialogue.map((l) => ({
          speaker: l.speaker,
          ...(l.text ? { text: resolveStr(l.text) } : {}),
          ...(l.isBlank ? { isBlank: true } : {}),
        })),
        choices: ex.choices.map(resolveStr),
        correctChoice: resolveStr(ex.correctChoice),
        ...(ex.answerAudio ? { answerAudio: convertAudio(ex.answerAudio) } : {}),
      }
    case 'listening_tap':
      return {
        ...base,
        tokenBank: ex.tokenBank.map(resolveStr),
        correctSequence: ex.correctSequence.map(resolveStr),
      }
    default:
      return base
  }
}

const now = new Date().toISOString()
const builderLesson = {
  builderId: crypto.randomUUID(),
  id: template.id,
  unitId: template.unitId,
  title: template.title,
  subtitle: template.subtitle ?? '',
  estimatedMinutes: template.estimatedMinutes ?? 5,
  exercises: template.exercises.map(convertExercise),
  createdAt: now,
  updatedAt: now,
}

ok(`Builder lesson created (builderId: ${builderLesson.builderId.slice(0, 8)}…)`)

// ─── 4. Collect audio and image files ──────────────────────────────────────────

step('4. Collecting assets…')

const zipEntries = []
const enc = new TextEncoder()

// .ts file
zipEntries.push({ name: `${lessonId}.ts`, data: enc.encode(tsCode) })

// lesson.json
zipEntries.push({ name: 'lesson.json', data: enc.encode(JSON.stringify(builderLesson, null, 2)) })

// Audio files
const audioDir = resolve(projectRoot, 'public/audio', lessonId)
if (existsSync(audioDir)) {
  const files = readdirSync(audioDir).filter((f) => !f.startsWith('.'))
  for (const f of files) {
    const data = readFileSync(join(audioDir, f))
    zipEntries.push({ name: `audio/${f}`, data: new Uint8Array(data) })
  }
  ok(`Audio: ${files.length} file(s) from public/audio/${lessonId}/`)
} else {
  info('No audio directory found — skipping.')
}

// Image files
const imageDir = resolve(projectRoot, 'public/images', lessonId)
if (existsSync(imageDir)) {
  const files = readdirSync(imageDir).filter((f) => !f.startsWith('.'))
  for (const f of files) {
    const data = readFileSync(join(imageDir, f))
    zipEntries.push({ name: `images/${f}`, data: new Uint8Array(data) })
  }
  ok(`Images: ${files.length} file(s) from public/images/${lessonId}/`)
} else {
  info('No images directory found — skipping.')
}

// ─── 5. Build ZIP ──────────────────────────────────────────────────────────────

step('5. Building ZIP…')

// Minimal STORE-mode ZIP writer (same logic as src/lib/builder/zipWriter.ts)

function crc32(data) {
  const table = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    table[i] = c
  }
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) crc = table[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  return (crc ^ 0xffffffff) >>> 0
}

function u16le(v) { return new Uint8Array([v & 0xff, (v >> 8) & 0xff]) }
function u32le(v) { return new Uint8Array([v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff]) }

function concat(...parts) {
  const len = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(len)
  let off = 0
  for (const p of parts) { out.set(p, off); off += p.length }
  return out
}

const localHeaders = []
const centralDirs = []
const offsets = []
let offset = 0

for (const entry of zipEntries) {
  const nameBytes = enc.encode(entry.name)
  const crc = crc32(entry.data)
  const size = entry.data.length

  const local = concat(
    new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
    u16le(20), u16le(0), u16le(0), u16le(0), u16le(0),
    u32le(crc), u32le(size), u32le(size),
    u16le(nameBytes.length), u16le(0),
    nameBytes, entry.data,
  )

  offsets.push(offset)
  localHeaders.push(local)
  offset += local.length
}

const centralStart = offset

for (let i = 0; i < zipEntries.length; i++) {
  const entry = zipEntries[i]
  const nameBytes = enc.encode(entry.name)
  const crc = crc32(entry.data)
  const size = entry.data.length

  const cd = concat(
    new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
    u16le(20), u16le(20), u16le(0), u16le(0), u16le(0), u16le(0),
    u32le(crc), u32le(size), u32le(size),
    u16le(nameBytes.length), u16le(0), u16le(0), u16le(0), u16le(0), u32le(0),
    u32le(offsets[i]),
    nameBytes,
  )

  centralDirs.push(cd)
  offset += cd.length
}

const centralSize = offset - centralStart

const eocd = concat(
  new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
  u16le(0), u16le(0),
  u16le(zipEntries.length), u16le(zipEntries.length),
  u32le(centralSize), u32le(centralStart),
  u16le(0),
)

const zipData = concat(...localHeaders, ...centralDirs, eocd)

// ─── 6. Write output ──────────────────────────────────────────────────────────

const outPath = resolve(outDir, `${lessonId}.zip`)
writeFileSync(outPath, zipData)

console.log(`\n${GREEN}${BOLD}Export complete!${RESET} ${CYAN}${outPath}${RESET}`)
info(`${zipEntries.length} entries, ${(zipData.length / 1024).toFixed(1)} KB`)
console.log(`\nTo import into the builder UI, use the ${BOLD}Importar .zip${RESET} button.\n`)
