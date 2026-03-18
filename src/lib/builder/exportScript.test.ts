import { describe, expect, it } from 'vitest'
import { execSync } from 'child_process'
import { existsSync, unlinkSync, readFileSync } from 'fs'
import { resolve } from 'path'
import { tmpdir } from 'os'

import { readZip } from './zipReader'

const projectRoot = resolve(__dirname, '../../..')
const script = resolve(projectRoot, 'scripts/export-lesson.mjs')

describe('export-lesson.mjs script', () => {
  it('exports a known lesson to a ZIP with lesson.json, .ts, and audio', () => {
    const outDir = tmpdir()
    const outPath = resolve(outDir, 'unit1-tembi-u.zip')

    // Clean up if leftover from previous run
    if (existsSync(outPath)) unlinkSync(outPath)

    execSync(`node "${script}" unit1-tembi-u`, {
      cwd: outDir,
      env: { ...process.env },
      stdio: 'pipe',
    })

    expect(existsSync(outPath)).toBe(true)

    // Parse the ZIP and verify contents
    const zipBuffer = readFileSync(outPath)
    const entries = readZip(zipBuffer.buffer.slice(zipBuffer.byteOffset, zipBuffer.byteOffset + zipBuffer.byteLength))

    const names = entries.map((e) => e.name)

    // Must contain the .ts file and lesson.json
    expect(names).toContain('unit1-tembi-u.ts')
    expect(names).toContain('lesson.json')

    // lesson.json must be valid and contain the correct id
    const jsonEntry = entries.find((e) => e.name === 'lesson.json')!
    const lesson = JSON.parse(new TextDecoder().decode(jsonEntry.data))
    expect(lesson.id).toBe('unit1-tembi-u')
    expect(lesson.unitId).toBe('unit1')
    expect(lesson.exercises.length).toBeGreaterThan(0)

    // Must contain audio files
    const audioEntries = names.filter((n) => n.startsWith('audio/'))
    expect(audioEntries.length).toBeGreaterThan(0)

    // Clean up
    unlinkSync(outPath)
  })

  it('fails gracefully for a non-existent lesson', () => {
    expect(() => {
      execSync(`node "${script}" nonexistent-lesson-xyz`, {
        cwd: tmpdir(),
        stdio: 'pipe',
      })
    }).toThrow()
  })

  it('supports --out-dir option', () => {
    const outDir = resolve(tmpdir(), `tupi-export-test-${Date.now()}`)
    const { mkdirSync, rmdirSync } = require('fs')
    mkdirSync(outDir, { recursive: true })

    execSync(`node "${script}" unit1-tembi-u --out-dir "${outDir}"`, {
      cwd: projectRoot,
      stdio: 'pipe',
    })

    const outPath = resolve(outDir, 'unit1-tembi-u.zip')
    expect(existsSync(outPath)).toBe(true)

    // Clean up
    unlinkSync(outPath)
    rmdirSync(outDir)
  })
})
