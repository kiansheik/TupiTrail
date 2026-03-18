import { describe, expect, it } from 'vitest'

import type { BuilderExercise } from './builderTypes'
import {
  collectBuilderGrammarNotes,
  mergeGrammarNotes,
} from './vocabCollector'

const makeExercise = (grammarNotes: Array<{ label: string; text: string }>): BuilderExercise => ({
  id: 'ex1',
  type: 'select_image',
  instruction: 'pick',
  prompt: 'test',
  options: [],
  correctOptionId: '',
  explanation: { grammarNotes },
})

describe('collectBuilderGrammarNotes', () => {
  it('collects notes from exercises', () => {
    const exercises = [
      makeExercise([
        { label: "-embi-", text: 'prefixo de paciente' },
        { label: "'u", text: 'ingerir; comer' },
      ]),
      makeExercise([
        { label: 'a-', text: 'eu; primeira pessoa' },
      ]),
    ]

    const notes = collectBuilderGrammarNotes(exercises)

    expect(notes).toHaveLength(3)
    expect(notes.map((n) => n.label)).toContain("-embi-")
    expect(notes.map((n) => n.label)).toContain("'u")
    expect(notes.map((n) => n.label)).toContain('a-')
  })

  it('deduplicates by lowercased label, keeping the first occurrence', () => {
    const exercises = [
      makeExercise([
        { label: 'A-', text: 'first definition' },
        { label: 'a-', text: 'second definition' },
      ]),
    ]

    const notes = collectBuilderGrammarNotes(exercises)

    expect(notes).toHaveLength(1)
    expect(notes[0].text).toBe('first definition')
  })

  it('skips empty labels', () => {
    const exercises = [
      makeExercise([
        { label: '', text: 'no label' },
        { label: '  ', text: 'whitespace label' },
        { label: 'valid', text: 'has label' },
      ]),
    ]

    const notes = collectBuilderGrammarNotes(exercises)

    expect(notes).toHaveLength(1)
    expect(notes[0].label).toBe('valid')
  })

  it('returns empty for exercises without grammar notes', () => {
    const exercises: BuilderExercise[] = [{
      id: 'ex1',
      type: 'select_image',
      instruction: 'pick',
      prompt: 'test',
      options: [],
      correctOptionId: '',
    }]

    expect(collectBuilderGrammarNotes(exercises)).toHaveLength(0)
  })
})

describe('mergeGrammarNotes', () => {
  it('merges notes from multiple sources without duplicates', () => {
    const set1 = [
      { label: 'a-', text: 'eu; primeira pessoa' },
      { label: "'u", text: 'ingerir' },
    ]
    const set2 = [
      { label: 'a-', text: 'different text (ignored — first wins)' },
      { label: '-seî', text: 'querer' },
    ]

    const merged = mergeGrammarNotes(set1, set2)

    expect(merged).toHaveLength(3)
    const aNote = merged.find((n) => n.label === 'a-')!
    expect(aNote.text).toBe('eu; primeira pessoa')
    expect(merged.map((n) => n.label)).toContain('-seî')
  })

  it('returns sorted by label', () => {
    const notes = mergeGrammarNotes(
      [{ label: 'z-suffix', text: 'z' }],
      [{ label: 'a-prefix', text: 'a' }],
    )

    expect(notes[0].label).toBe('a-prefix')
    expect(notes[1].label).toBe('z-suffix')
  })
})
