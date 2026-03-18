import type { Exercise } from '@/core/lesson-engine/types'
import type { BuilderExercise } from './builderTypes'

// ─── Collect vocab from builder exercises ─────────────────────────────────────

export function collectBuilderVocab(exercises: BuilderExercise[]): Set<string> {
  const vocab = new Set<string>()

  const add = (s: string | undefined) => {
    const t = s?.trim()
    if (t) vocab.add(t)
  }

  for (const ex of exercises) {
    add(ex.meaning)

    if (ex.type === 'select_image') {
      add(ex.prompt)
      for (const opt of ex.options) {
        add(opt.label)
        add(opt.id)
      }
    }

    if (ex.type === 'token_translate') {
      for (const seg of ex.sourceText) add(seg.text)
      for (const seg of ex.promptSegments ?? []) add(seg.text)
      for (const t of ex.tokenBank) add(t)
      for (const t of ex.correctSequence) add(t)
    }

    if (ex.type === 'multiple_choice_translation') {
      add(ex.prompt)
      for (const seg of ex.promptSegments ?? []) add(seg.text)
      for (const c of ex.choices) add(c)
      add(ex.correctChoice)
    }

    if (ex.type === 'dialogue_choice') {
      for (const line of ex.dialogue) add(line.text)
      for (const c of ex.choices) add(c)
      add(ex.correctChoice)
    }

    if (ex.type === 'listening_tap') {
      for (const t of ex.tokenBank) add(t)
      for (const t of ex.correctSequence) add(t)
    }
  }

  return vocab
}

// ─── Collect vocab from compiled engine exercises (e.g. lesson1) ──────────────

export function collectEngineVocab(exercises: Exercise[]): Set<string> {
  const vocab = new Set<string>()

  const add = (s: string | undefined) => {
    const t = s?.trim()
    if (t) vocab.add(t)
  }

  for (const ex of exercises) {
    add(ex.meaning)

    if (ex.type === 'select_image') {
      add(ex.prompt)
      for (const opt of ex.options) add(opt.label)
    }

    if (ex.type === 'token_translate') {
      for (const seg of ex.sourceText) add(seg.text)
      for (const seg of ex.promptSegments ?? []) add(seg.text)
      for (const t of ex.tokenBank) add(t)
      for (const t of ex.correctSequence) add(t)
    }

    if (ex.type === 'multiple_choice_translation') {
      add(ex.prompt)
      for (const seg of ex.promptSegments ?? []) add(seg.text)
      for (const c of ex.choices) add(c)
      add(ex.correctChoice)
    }

    if (ex.type === 'dialogue_choice') {
      for (const line of ex.dialogue) add(line.text)
      for (const c of ex.choices) add(c)
      add(ex.correctChoice)
    }

    if (ex.type === 'listening_tap') {
      for (const t of ex.tokenBank) add(t)
      for (const t of ex.correctSequence) add(t)
    }
  }

  return vocab
}

// ─── Collect grammar notes from builder exercises ─────────────────────────────

export type GrammarNoteEntry = { label: string; text: string }

export function collectBuilderGrammarNotes(exercises: BuilderExercise[]): GrammarNoteEntry[] {
  const seen = new Map<string, string>() // label (lowercased) → text
  for (const ex of exercises) {
    for (const note of ex.explanation?.grammarNotes ?? []) {
      const key = note.label.trim().toLowerCase()
      if (key && !seen.has(key)) {
        seen.set(key, note.text.trim())
      }
    }
  }
  return Array.from(seen, ([, text], i) => ({
    label: Array.from(seen.keys())[i],
    text,
  })).sort((a, b) => a.label.localeCompare(b.label))
}

export function collectEngineGrammarNotes(exercises: Exercise[]): GrammarNoteEntry[] {
  const seen = new Map<string, string>()
  for (const ex of exercises) {
    for (const note of ex.explanation?.grammarNotes ?? []) {
      const key = note.label.trim().toLowerCase()
      if (key && !seen.has(key)) {
        seen.set(key, note.text.trim())
      }
    }
  }
  return Array.from(seen, ([, text], i) => ({
    label: Array.from(seen.keys())[i],
    text,
  })).sort((a, b) => a.label.localeCompare(b.label))
}

export function mergeGrammarNotes(...noteSets: GrammarNoteEntry[][]): GrammarNoteEntry[] {
  const seen = new Map<string, string>()
  for (const set of noteSets) {
    for (const note of set) {
      const key = note.label.toLowerCase()
      if (!seen.has(key)) seen.set(key, note.text)
    }
  }
  return Array.from(seen, ([label, text]) => ({ label, text }))
    .sort((a, b) => a.label.localeCompare(b.label))
}

// ─── Merge multiple vocab sets into a sorted array ────────────────────────────

export function mergeVocab(...sets: Set<string>[]): string[] {
  const merged = new Set<string>()
  for (const s of sets) s.forEach((v) => merged.add(v))
  return Array.from(merged).sort((a, b) => a.localeCompare(b))
}
