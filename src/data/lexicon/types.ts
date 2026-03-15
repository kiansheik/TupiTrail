export type LanguageTag = 'en' | 'pt-BR' | 'tupi'

export type LocalizedText = {
  value: string
  lang: LanguageTag
  key?: string
}

export type EnToTupiMap = Record<string, string>
