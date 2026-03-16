import type { BuilderLesson } from './builderTypes'
import { saveImageDataUrl } from './imageStorage'

const LS_KEY = 'tupi_builder_lessons'
const LS_MIGRATED_KEY = 'tupi_builder_images_migrated'

/**
 * Derives a canonical lesson ID from a unitId and title.
 * "unit1" + "Drinks & Polite Words" → "unit1-drinks-polite-words"
 */
export function titleToLessonId(unitId: string, title: string): string {
  const slug = title
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // strip diacritics
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')    // non-alphanumeric → dashes
    .replace(/^-+|-+$/g, '')         // trim leading/trailing dashes
  return slug ? `${unitId}-${slug}` : `${unitId}-lesson`
}

/**
 * One-time migration: move any legacy `imageSrc` base64 data URIs that were
 * stored directly in the lesson JSON into IndexedDB, replacing them with an
 * `imageKey` reference. Runs once per browser, tracked by a localStorage flag.
 */
export async function migrateImagesToIndexedDB(): Promise<void> {
  if (localStorage.getItem(LS_MIGRATED_KEY)) return

  try {
    const raw = localStorage.getItem(LS_KEY)
    if (!raw) { localStorage.setItem(LS_MIGRATED_KEY, '1'); return }

    const lessons = JSON.parse(raw) as Array<Record<string, unknown>>
    let changed = false

    for (const lesson of lessons) {
      const exercises = lesson.exercises as Array<Record<string, unknown>> | undefined
      if (!Array.isArray(exercises)) continue

      for (const ex of exercises) {
        if (ex.type !== 'select_image') continue
        const options = ex.options as Array<Record<string, unknown>> | undefined
        if (!Array.isArray(options)) continue

        for (const opt of options) {
          const src = opt.imageSrc as string | undefined
          if (!src) continue
          const key = crypto.randomUUID()
          await saveImageDataUrl(key, src)
          opt.imageKey = key
          delete opt.imageSrc
          changed = true
        }
      }
    }

    if (changed) localStorage.setItem(LS_KEY, JSON.stringify(lessons))
    localStorage.setItem(LS_MIGRATED_KEY, '1')
  } catch {
    // Non-fatal — images may just need re-uploading
  }
}

export function listBuilderLessons(): BuilderLesson[] {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? (JSON.parse(raw) as BuilderLesson[]) : []
  } catch {
    return []
  }
}

export function getBuilderLesson(builderId: string): BuilderLesson | null {
  return listBuilderLessons().find((l) => l.builderId === builderId) ?? null
}

export function saveBuilderLesson(lesson: BuilderLesson): void {
  const list = listBuilderLessons()
  const idx = list.findIndex((l) => l.builderId === lesson.builderId)
  const updated: BuilderLesson = { ...lesson, updatedAt: new Date().toISOString() }
  if (idx >= 0) {
    list[idx] = updated
  } else {
    list.unshift(updated)
  }
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

export function deleteBuilderLesson(builderId: string): void {
  const list = listBuilderLessons().filter((l) => l.builderId !== builderId)
  localStorage.setItem(LS_KEY, JSON.stringify(list))
}

export function duplicateBuilderLesson(builderId: string): BuilderLesson | null {
  const src = getBuilderLesson(builderId)
  if (!src) return null
  const now = new Date().toISOString()
  const copy: BuilderLesson = {
    ...src,
    builderId: crypto.randomUUID(),
    id: src.id + '-copy',
    title: src.title + ' (cópia)',
    createdAt: now,
    updatedAt: now,
  }
  saveBuilderLesson(copy)
  return copy
}

export function newEmptyLesson(): BuilderLesson {
  const now = new Date().toISOString()
  const defaultUnitId = 'unit1'
  const defaultTitle = 'Nova Lição'
  return {
    builderId: crypto.randomUUID(),
    id: titleToLessonId(defaultUnitId, defaultTitle),
    unitId: defaultUnitId,
    title: defaultTitle,
    subtitle: '',
    estimatedMinutes: 5,
    exercises: [],
    createdAt: now,
    updatedAt: now,
  }
}
