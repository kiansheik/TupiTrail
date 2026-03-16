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

// ─── Merge multiple vocab sets into a sorted array ────────────────────────────

export function mergeVocab(...sets: Set<string>[]): string[] {
  const merged = new Set<string>()
  for (const s of sets) s.forEach((v) => merged.add(v))
  return Array.from(merged).sort((a, b) => a.localeCompare(b))
}
