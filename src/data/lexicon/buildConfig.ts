import type { LanguageTag } from '@/data/lexicon/types'

const target = (import.meta.env.VITE_LEXICON_TARGET_LANG as LanguageTag | undefined) ?? 'en'

export const lexiconTargetLanguage: LanguageTag = target
