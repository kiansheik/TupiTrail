import { describe, expect, it, vi, beforeEach } from 'vitest'

import type { BuilderLesson, BuilderSelectImage } from './builderTypes'
import type { ZipEntry } from './zipWriter'

// ─── Mocks ───────────────────────────────────────────────────────────────────

const savedAudio = new Map<string, Blob>()
const savedImages = new Map<string, string>()
let savedLesson: BuilderLesson | null = null

vi.mock('./audioStorage', () => ({
  saveAudioBlob: vi.fn(async (key: string, blob: Blob) => {
    savedAudio.set(key, blob)
  }),
}))

vi.mock('./imageStorage', () => ({
  saveImageDataUrl: vi.fn(async (key: string, dataUrl: string) => {
    savedImages.set(key, dataUrl)
  }),
}))

vi.mock('./builderStorage', () => ({
  saveBuilderLesson: vi.fn((lesson: BuilderLesson) => {
    savedLesson = lesson
  }),
}))

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Build a STORE-mode ZIP Uint8Array from entries (same as zipRoundTrip.test.ts helper). */
function buildZipBytes(entries: ZipEntry[]): Uint8Array {
  const enc = new TextEncoder()
  const u16le = (v: number) => new Uint8Array([v & 0xff, (v >> 8) & 0xff])
  const u32le = (v: number) =>
    new Uint8Array([v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff])

  function crc32(data: Uint8Array): number {
    const t = new Uint32Array(256)
    for (let i = 0; i < 256; i++) {
      let c = i
      for (let j = 0; j < 8; j++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
      t[i] = c
    }
    let crc = 0xffffffff
    for (let i = 0; i < data.length; i++) crc = t[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
    return (crc ^ 0xffffffff) >>> 0
  }

  function concat(...parts: Uint8Array[]): Uint8Array {
    const out = new Uint8Array(parts.reduce((s, p) => s + p.length, 0))
    let off = 0
    for (const p of parts) { out.set(p, off); off += p.length }
    return out
  }

  const locals: Uint8Array[] = []
  const cds: Uint8Array[] = []
  const offsets: number[] = []
  let off = 0

  for (const e of entries) {
    const name = enc.encode(e.name)
    const crc = crc32(e.data)
    const local = concat(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]),
      u16le(20), u16le(0), u16le(0), u16le(0), u16le(0),
      u32le(crc), u32le(e.data.length), u32le(e.data.length),
      u16le(name.length), u16le(0), name, e.data,
    )
    offsets.push(off); locals.push(local); off += local.length
  }

  const cdStart = off
  for (let i = 0; i < entries.length; i++) {
    const e = entries[i]
    const name = enc.encode(e.name)
    const crc = crc32(e.data)
    const cd = concat(
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]),
      u16le(20), u16le(20), u16le(0), u16le(0), u16le(0), u16le(0),
      u32le(crc), u32le(e.data.length), u32le(e.data.length),
      u16le(name.length), u16le(0), u16le(0), u16le(0), u16le(0), u32le(0),
      u32le(offsets[i]), name,
    )
    cds.push(cd); off += cd.length
  }

  const cdSize = off - cdStart
  const eocd = concat(
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]),
    u16le(0), u16le(0),
    u16le(entries.length), u16le(entries.length),
    u32le(cdSize), u32le(cdStart), u16le(0),
  )
  return concat(...locals, ...cds, eocd)
}

function makeTestLesson(): BuilderLesson {
  return {
    builderId: 'original-builder-id',
    id: 'unit1-test-lesson',
    unitId: 'unit1',
    title: 'Test Lesson',
    subtitle: 'Subtitle',
    estimatedMinutes: 5,
    exercises: [
      {
        id: 'ex1',
        type: 'select_image',
        instruction: 'Pick one',
        prompt: 'Agua',
        options: [
          { id: 'water', label: 'Water', imageEmoji: '💧', imageKey: 'img-uuid-1' },
          { id: 'coffee', label: 'Coffee', imageEmoji: '☕' },
        ],
        correctOptionId: 'water',
      } satisfies BuilderSelectImage,
      {
        id: 'ex2',
        type: 'token_translate',
        instruction: 'Translate',
        sourceText: [{ text: 'Quero agua' }],
        tokenBank: ['I', 'want', 'water'],
        correctSequence: ['I', 'want', 'water'],
        audio: { id: 'ex2-audio', mode: 'recorded' as const, blobKey: 'ex2_blob', mimeType: 'audio/webm' },
      },
    ],
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z',
  }
}

function makeZipFile(lesson: BuilderLesson, audioData?: Uint8Array, imageData?: Uint8Array): File {
  const enc = new TextEncoder()
  const entries: ZipEntry[] = [
    { name: 'lesson.json', data: enc.encode(JSON.stringify(lesson)) },
  ]
  if (audioData) {
    entries.push({ name: 'audio/ex2_blob.webm', data: audioData })
  }
  if (imageData) {
    entries.push({ name: 'images/water.jpg', data: imageData })
  }
  const zipBytes = buildZipBytes(entries)
  return new File([zipBytes.buffer as ArrayBuffer], 'test.zip', { type: 'application/zip' })
}

// ─── Tests ───────────────────────────────────────────────────────────────────

describe('importLessonZip', () => {
  beforeEach(() => {
    savedAudio.clear()
    savedImages.clear()
    savedLesson = null
  })

  it('creates a new BuilderLesson with a fresh builderId', async () => {
    const { importLessonZip } = await import('./importLesson')
    const original = makeTestLesson()
    const file = makeZipFile(original)

    const result = await importLessonZip(file)

    expect(result.builderId).not.toBe(original.builderId)
    expect(result.id).toBe('unit1-test-lesson')
    expect(result.title).toBe('Test Lesson')
    expect(result.exercises).toHaveLength(2)
  })

  it('saves the lesson to builder storage', async () => {
    const { importLessonZip } = await import('./importLesson')
    const file = makeZipFile(makeTestLesson())

    await importLessonZip(file)

    expect(savedLesson).not.toBeNull()
    expect(savedLesson!.id).toBe('unit1-test-lesson')
  })

  it('restores audio blobs to IndexedDB', async () => {
    const { importLessonZip } = await import('./importLesson')
    const audioBytes = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3])
    const file = makeZipFile(makeTestLesson(), audioBytes)

    await importLessonZip(file)

    expect(savedAudio.has('ex2_blob')).toBe(true)
    const blob = savedAudio.get('ex2_blob')!
    expect(blob.type).toBe('audio/webm')
  })

  it('restores images to IndexedDB with correct imageKey', async () => {
    const { importLessonZip } = await import('./importLesson')
    // A minimal 1-byte JPEG-like payload
    const imageBytes = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
    const file = makeZipFile(makeTestLesson(), undefined, imageBytes)

    await importLessonZip(file)

    // The 'water' option has imageKey 'img-uuid-1'
    expect(savedImages.has('img-uuid-1')).toBe(true)
    const dataUrl = savedImages.get('img-uuid-1')!
    expect(dataUrl.startsWith('data:image/jpeg;base64,')).toBe(true)
  })

  it('throws when lesson.json is missing', async () => {
    const { importLessonZip } = await import('./importLesson')
    const enc = new TextEncoder()
    const zipBytes = buildZipBytes([{ name: 'other.txt', data: enc.encode('hi') }])
    const file = new File([zipBytes.buffer as ArrayBuffer], 'bad.zip', { type: 'application/zip' })

    await expect(importLessonZip(file)).rejects.toThrow('lesson.json')
  })
})
