/**
 * Minimal STORE-mode ZIP writer (no compression).
 * Fully self-contained — no external dependencies.
 */

// ─── CRC-32 ──────────────────────────────────────────────────────────────────

const CRC_TABLE = (() => {
  const t = new Uint32Array(256)
  for (let i = 0; i < 256; i++) {
    let c = i
    for (let j = 0; j < 8; j++) {
      c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1
    }
    t[i] = c
  }
  return t
})()

function crc32(data: Uint8Array): number {
  let crc = 0xffffffff
  for (let i = 0; i < data.length; i++) {
    crc = CRC_TABLE[(crc ^ data[i]) & 0xff] ^ (crc >>> 8)
  }
  return (crc ^ 0xffffffff) >>> 0
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const enc = new TextEncoder()

function u16le(v: number): Uint8Array {
  return new Uint8Array([v & 0xff, (v >> 8) & 0xff])
}

function u32le(v: number): Uint8Array {
  return new Uint8Array([v & 0xff, (v >> 8) & 0xff, (v >> 16) & 0xff, (v >> 24) & 0xff])
}

function concat(...parts: Uint8Array[]): Uint8Array {
  const len = parts.reduce((s, p) => s + p.length, 0)
  const out = new Uint8Array(len)
  let offset = 0
  for (const p of parts) {
    out.set(p, offset)
    offset += p.length
  }
  return out
}

// ─── Public API ───────────────────────────────────────────────────────────────

export type ZipEntry = { name: string; data: Uint8Array }

/** Creates a STORE-mode ZIP Blob from an array of named entries. */
export function buildZip(entries: ZipEntry[]): Blob {
  const localHeaders: Uint8Array[] = []
  const centralDirs: Uint8Array[] = []
  const offsets: number[] = []
  let offset = 0

  for (const entry of entries) {
    const nameBytes = enc.encode(entry.name)
    const crc = crc32(entry.data)
    const size = entry.data.length

    // Local file header
    const local = concat(
      new Uint8Array([0x50, 0x4b, 0x03, 0x04]), // signature
      u16le(20), // version needed
      u16le(0), // flags
      u16le(0), // compression: STORE
      u16le(0), // mod time
      u16le(0), // mod date
      u32le(crc),
      u32le(size),
      u32le(size),
      u16le(nameBytes.length),
      u16le(0), // extra length
      nameBytes,
      entry.data,
    )

    offsets.push(offset)
    localHeaders.push(local)
    offset += local.length
  }

  const centralStart = offset

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]
    const nameBytes = enc.encode(entry.name)
    const crc = crc32(entry.data)
    const size = entry.data.length

    const cd = concat(
      new Uint8Array([0x50, 0x4b, 0x01, 0x02]), // signature
      u16le(20), // version made by
      u16le(20), // version needed
      u16le(0), // flags
      u16le(0), // compression: STORE
      u16le(0), // mod time
      u16le(0), // mod date
      u32le(crc),
      u32le(size),
      u32le(size),
      u16le(nameBytes.length),
      u16le(0), // extra length
      u16le(0), // comment length
      u16le(0), // disk start
      u16le(0), // internal attrs
      u32le(0), // external attrs
      u32le(offsets[i]),
      nameBytes,
    )

    centralDirs.push(cd)
    offset += cd.length
  }

  const centralSize = offset - centralStart

  const eocd = concat(
    new Uint8Array([0x50, 0x4b, 0x05, 0x06]), // signature
    u16le(0), // disk number
    u16le(0), // start disk
    u16le(entries.length),
    u16le(entries.length),
    u32le(centralSize),
    u32le(centralStart),
    u16le(0), // comment length
  )

  const all = concat(...localHeaders, ...centralDirs, eocd)
  return new Blob([all.buffer as ArrayBuffer], { type: 'application/zip' })
}
