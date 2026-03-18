/**
 * Minimal ZIP reader for STORE-mode ZIPs (no compression).
 * Companion to zipWriter.ts — fully self-contained, no external deps.
 */

export type ZipFileEntry = { name: string; data: Uint8Array }

function u16(buf: DataView, off: number): number {
  return buf.getUint16(off, true)
}

function u32(buf: DataView, off: number): number {
  return buf.getUint32(off, true)
}

/**
 * Find the End-of-Central-Directory record by scanning backwards.
 * Returns the byte offset of the EOCD signature within the buffer.
 */
function findEOCD(view: DataView): number {
  // EOCD signature: 0x06054b50
  for (let i = view.byteLength - 22; i >= 0; i--) {
    if (u32(view, i) === 0x06054b50) return i
  }
  throw new Error('Invalid ZIP: EOCD not found')
}

/** Parse a ZIP ArrayBuffer and return all file entries. */
export function readZip(buffer: ArrayBuffer): ZipFileEntry[] {
  const view = new DataView(buffer)
  const bytes = new Uint8Array(buffer)
  const dec = new TextDecoder()

  const eocdOff = findEOCD(view)
  const cdOffset = u32(view, eocdOff + 16)
  const cdCount = u16(view, eocdOff + 10)

  const entries: ZipFileEntry[] = []
  let off = cdOffset

  for (let i = 0; i < cdCount; i++) {
    if (u32(view, off) !== 0x02014b50) {
      throw new Error('Invalid ZIP: bad central directory signature')
    }

    const compression = u16(view, off + 10)
    const compSize = u32(view, off + 20)
    const nameLen = u16(view, off + 28)
    const extraLen = u16(view, off + 30)
    const commentLen = u16(view, off + 32)
    const localOff = u32(view, off + 42)
    const name = dec.decode(bytes.slice(off + 46, off + 46 + nameLen))

    // Skip directories
    if (!name.endsWith('/')) {
      if (compression !== 0) {
        throw new Error(`ZIP entry "${name}" uses compression (method ${compression}). Only STORE-mode ZIPs are supported.`)
      }

      // Parse the local file header to find where data starts
      const localNameLen = u16(view, localOff + 26)
      const localExtraLen = u16(view, localOff + 28)
      const dataStart = localOff + 30 + localNameLen + localExtraLen
      const data = bytes.slice(dataStart, dataStart + compSize)

      entries.push({ name, data })
    }

    off += 46 + nameLen + extraLen + commentLen
  }

  return entries
}
