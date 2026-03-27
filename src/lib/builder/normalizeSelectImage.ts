import type { BuilderSelectImage } from './builderTypes'

function slugify(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function ensureUnique(base: string, used: Set<string>): string {
  let id = base
  let i = 2
  while (!id || used.has(id)) {
    id = `${base}-${i++}`
  }
  used.add(id)
  return id
}

/**
 * Normalize select_image options so IDs are present and unique.
 * If an option id is missing, derive one from the label (slugified) or a fallback.
 * When duplicates exist, suffixes are added (e.g., "coffee-2").
 */
export function normalizeSelectImageExercise(ex: BuilderSelectImage): BuilderSelectImage {
  const used = new Set<string>()
  const idMap = new Map<string, string>()

  const options = ex.options.map((opt, idx) => {
    const rawId = (opt.id ?? '').trim()
    let base = rawId
    if (!base) {
      const label = (opt.label ?? '').trim()
      base = slugify(label) || `option-${idx + 1}`
    }

    const unique = ensureUnique(base, used)
    if (rawId && !idMap.has(rawId)) idMap.set(rawId, unique)

    return { ...opt, id: unique }
  })

  let correctOptionId = ex.correctOptionId
  if (correctOptionId && idMap.has(correctOptionId)) {
    correctOptionId = idMap.get(correctOptionId) ?? correctOptionId
  }

  return { ...ex, options, correctOptionId }
}
