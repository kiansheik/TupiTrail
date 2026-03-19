import type { BuilderLesson, BuilderSelectImage } from './builderTypes'
import { readZip } from './zipReader'
import { saveAudioBlob } from './audioStorage'
import { saveImageDataUrl } from './imageStorage'
import { saveBuilderLesson } from './builderStorage'

const dec = new TextDecoder()

/**
 * Import a lesson ZIP file into the builder's local storage.
 * Requires `lesson.json` inside the ZIP (included in exports since v2).
 * Audio blobs and images are restored to IndexedDB.
 * Returns the newly created BuilderLesson with a fresh builderId.
 */
export async function importLessonZip(file: File): Promise<BuilderLesson> {
  const buffer = await file.arrayBuffer()
  const entries = readZip(buffer)

  // ── Parse lesson.json ────────────────────────────────────────────────────
  const jsonEntry = entries.find((e) => e.name === 'lesson.json')
  if (!jsonEntry) {
    throw new Error(
      'Este ZIP não contém lesson.json. Apenas ZIPs exportados pela versão atual do Builder podem ser importados.',
    )
  }

  const lesson: BuilderLesson = JSON.parse(dec.decode(jsonEntry.data))

  // Assign a fresh builderId so this is a new independent copy
  lesson.builderId = crypto.randomUUID()
  const now = new Date().toISOString()
  lesson.createdAt = now
  lesson.updatedAt = now

  // ── Restore audio blobs to IndexedDB ─────────────────────────────────────
  const audioEntries = entries.filter((e) => e.name.startsWith('audio/'))
  for (const entry of audioEntries) {
    // File names: audio/{blobKey}.webm or audio/{blobKey}.ogg
    const fileName = entry.name.slice('audio/'.length)
    const blobKey = fileName.replace(/\.(webm|ogg)$/, '')
    const mimeType = fileName.endsWith('.ogg') ? 'audio/ogg' : 'audio/webm'
    const blob = new Blob([entry.data.buffer as ArrayBuffer], { type: mimeType })
    await saveAudioBlob(blobKey, blob)
  }

  // ── Restore images to IndexedDB ──────────────────────────────────────────
  const imageEntries = entries.filter((e) => e.name.startsWith('images/'))
  // Build a lookup: optionId → image bytes
  const imageByOptionId = new Map<string, Uint8Array>()
  for (const entry of imageEntries) {
    const optionId = entry.name.slice('images/'.length).replace(/\.\w+$/, '')
    imageByOptionId.set(optionId, entry.data)
  }

  // Match images to their imageKey in the lesson data
  for (const ex of lesson.exercises) {
    if (ex.type !== 'select_image') continue
    for (const opt of (ex as BuilderSelectImage).options) {
      const imgData = imageByOptionId.get(opt.id)
      if (!imgData) continue

      // Ensure the option has an imageKey; create one if missing
      if (!opt.imageKey) opt.imageKey = crypto.randomUUID()

      // Convert binary to base64 data URL
      let binary = ''
      for (let i = 0; i < imgData.length; i++) binary += String.fromCharCode(imgData[i])
      const dataUrl = `data:image/jpeg;base64,${btoa(binary)}`
      await saveImageDataUrl(opt.imageKey, dataUrl)
    }
  }

  // ── Save to localStorage ─────────────────────────────────────────────────
  saveBuilderLesson(lesson)
  return lesson
}
