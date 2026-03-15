import { enToTupiMap } from '@/data/lexicon/enToTupi.map'
import { lexiconTargetLanguage } from '@/data/lexicon/buildConfig'
import type { LanguageTag, LocalizedText } from '@/data/lexicon/types'

const normalizeForKey = (value: string): string => {
  const cleaned = value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]+/g, ' ')
    .trim()
    .replace(/\s+/g, '_')

  return cleaned || 'empty'
}

const splitOuterPunctuation = (value: string): { prefix: string; core: string; suffix: string } => {
  const match = value.match(/^(\W*)([\s\S]*?)(\W*)$/)
  if (!match) {
    return { prefix: '', core: value, suffix: '' }
  }

  return {
    prefix: match[1] ?? '',
    core: match[2] ?? '',
    suffix: match[3] ?? '',
  }
}

const applySourceCasing = (source: string, translated: string): string => {
  if (!translated) {
    return translated
  }

  if (source === source.toUpperCase()) {
    return translated.toUpperCase()
  }

  const looksTitleCase = source[0] === source[0]?.toUpperCase() && source.slice(1) === source.slice(1).toLowerCase()
  if (looksTitleCase) {
    return translated[0].toUpperCase() + translated.slice(1)
  }

  return translated
}

export const localizeText = (value: string, lang: LanguageTag, key?: string): LocalizedText => ({
  value,
  lang,
  key: key ?? `${lang}:${normalizeForKey(value)}`,
})

export const enText = (value: string, key?: string): LocalizedText => localizeText(value, 'en', key)

export const ptBrText = (value: string, key?: string): LocalizedText => localizeText(value, 'pt-BR', key)

export const tupiText = (value: string, key?: string): LocalizedText => localizeText(value, 'tupi', key)

export const resolveLocalizedText = (text: LocalizedText): string => {
  if (lexiconTargetLanguage !== 'tupi' || text.lang !== 'en') {
    return text.value
  }

  const key = text.key ?? `${text.lang}:${normalizeForKey(text.value)}`
  const mapped = enToTupiMap[key]
  if (!mapped) {
    return text.value
  }

  const { prefix, core, suffix } = splitOuterPunctuation(text.value)
  const cased = applySourceCasing(core, mapped)
  return `${prefix}${cased}${suffix}`
}

export type LexiconInventoryEntry = {
  key: string
  source: string
  sourceLang: LanguageTag
}

export const collectLocalizedEntries = (texts: LocalizedText[]): LexiconInventoryEntry[] => {
  const dedupe = new Map<string, LexiconInventoryEntry>()

  texts.forEach((text) => {
    const key = text.key ?? `${text.lang}:${normalizeForKey(text.value)}`
    if (dedupe.has(key)) {
      return
    }

    dedupe.set(key, {
      key,
      source: text.value,
      sourceLang: text.lang,
    })
  })

  return [...dedupe.values()]
}
