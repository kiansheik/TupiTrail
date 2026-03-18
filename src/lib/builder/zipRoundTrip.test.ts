import { describe, expect, it } from 'vitest'

import { readZip } from './zipReader'
import type { ZipEntry } from './zipWriter'

/**
 * Builds a STORE-mode ZIP as a Uint8Array (same logic as zipWriter.ts buildZip,
 * but returns raw bytes instead of a Blob for synchronous test access).
 */
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
    for (const p of parts) {
      out.set(p, off)
      off += p.length
    }
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
    offsets.push(off)
    locals.push(local)
    off += local.length
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
    cds.push(cd)
    off += cd.length
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

describe('ZIP round-trip (write then read)', () => {
  it('round-trips a single text entry', () => {
    const original: ZipEntry[] = [
      { name: 'hello.txt', data: new TextEncoder().encode('Hello, world!') },
    ]
    const result = readZip(buildZipBytes(original).buffer as ArrayBuffer)

    expect(result).toHaveLength(1)
    expect(result[0].name).toBe('hello.txt')
    expect(new TextDecoder().decode(result[0].data)).toBe('Hello, world!')
  })

  it('round-trips multiple entries including binary data', () => {
    const binary = new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0x00, 0xff])
    const original: ZipEntry[] = [
      { name: 'text.txt', data: new TextEncoder().encode('abc') },
      { name: 'audio/clip.webm', data: binary },
      { name: 'lesson.json', data: new TextEncoder().encode('{"id":"test"}') },
    ]
    const result = readZip(buildZipBytes(original).buffer as ArrayBuffer)

    expect(result).toHaveLength(3)
    expect(result.map((e) => e.name)).toEqual(['text.txt', 'audio/clip.webm', 'lesson.json'])
    expect(Array.from(result[1].data)).toEqual(Array.from(binary))
  })

  it('handles an empty file entry', () => {
    const original: ZipEntry[] = [{ name: 'empty.txt', data: new Uint8Array(0) }]
    const result = readZip(buildZipBytes(original).buffer as ArrayBuffer)

    expect(result).toHaveLength(1)
    expect(result[0].data.length).toBe(0)
  })

  it('preserves unicode in file names', () => {
    const original: ZipEntry[] = [
      { name: "tembi'u.ts", data: new TextEncoder().encode('x') },
    ]
    const result = readZip(buildZipBytes(original).buffer as ArrayBuffer)

    expect(result[0].name).toBe("tembi'u.ts")
  })
})

describe('readZip error handling', () => {
  it('throws on invalid buffer', () => {
    expect(() => readZip(new ArrayBuffer(4))).toThrow('EOCD not found')
  })
})
