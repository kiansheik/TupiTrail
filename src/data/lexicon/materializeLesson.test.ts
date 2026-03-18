import { describe, expect, it } from 'vitest'

import type { LessonTemplateData } from '@/core/lesson-engine/template-types'
import { materializeLesson } from '@/data/lexicon/materializeLesson'

const template: LessonTemplateData = {
  id: 'test-lesson',
  unitId: 'unit1',
  title: 'Test',
  subtitle: 'sub',
  estimatedMinutes: 2,
  exercises: [
    {
      id: 'ex1',
      type: 'select_image',
      instruction: 'Selecione a imagem correta',
      prompt: 'Apykaba',
      options: [
        { id: 'chair', label: 'APYKABA', imageEmoji: '🪑' },
        { id: 'food', label: 'Tembi\'u', imageEmoji: '🍛' },
      ],
      correctOptionId: 'chair',
      meaning: 'Cadeira',
      xp: 8,
    },
    {
      id: 'ex2',
      type: 'token_translate',
      instruction: 'Traduza',
      sourceText: [{ text: 'QUERO Água' }],
      promptSegments: [{ text: 'A\'USEÎ', highlight: 'new-word' as const }],
      tokenBank: ['Quero', 'Beber', 'ÁGUA'],
      correctSequence: ['Quero', 'Beber', 'Água'],
      meaning: 'I want water',
      xp: 10,
    },
    {
      id: 'ex3',
      type: 'multiple_choice_translation',
      instruction: 'Escolha',
      prompt: 'WELCOME',
      choices: ['De Nada', 'Bem-Vindo', 'Obrigado'],
      correctChoice: 'Bem-Vindo',
      meaning: 'Welcome',
      xp: 8,
    },
    {
      id: 'ex4',
      type: 'dialogue_choice',
      instruction: 'Complete',
      dialogue: [
        { speaker: 'Garçom', text: 'Chá Ou Café?' },
        { speaker: 'Você', isBlank: true },
      ],
      choices: ['Chá, Por Favor.', 'Bem-Vindo!'],
      correctChoice: 'Chá, Por Favor.',
      meaning: 'Tea, please.',
      xp: 10,
    },
    {
      id: 'ex5',
      type: 'listening_tap',
      instruction: 'Toque',
      tokenBank: ['CHÁ', 'CAFÉ', 'Água'],
      correctSequence: ['CHÁ'],
      meaning: 'tea',
      xp: 8,
    },
  ],
}

describe('materializeLesson lowercases content strings', () => {
  const lesson = materializeLesson(template)

  it('lowercases select_image prompt and option labels', () => {
    const ex = lesson.exercises.find((e) => e.id === 'ex1')!
    expect(ex.type).toBe('select_image')
    if (ex.type === 'select_image') {
      expect(ex.prompt).toBe('apykaba')
      expect(ex.options[0].label).toBe('apykaba')
      expect(ex.options[1].label).toBe("tembi'u")
    }
  })

  it('lowercases token_translate tokenBank, correctSequence, and sourceText', () => {
    const ex = lesson.exercises.find((e) => e.id === 'ex2')!
    if (ex.type === 'token_translate') {
      expect(ex.tokenBank).toEqual(['quero', 'beber', 'água'])
      expect(ex.correctSequence).toEqual(['quero', 'beber', 'água'])
      expect(ex.sourceText[0].text).toBe('quero água')
    }
  })

  it('lowercases token_translate promptSegments', () => {
    const ex = lesson.exercises.find((e) => e.id === 'ex2')!
    if (ex.type === 'token_translate') {
      expect(ex.promptSegments![0].text).toBe("a'useî")
      expect(ex.promptSegments![0].highlight).toBe('new-word') // highlight preserved
    }
  })

  it('lowercases multiple_choice prompt, choices, and correctChoice', () => {
    const ex = lesson.exercises.find((e) => e.id === 'ex3')!
    if (ex.type === 'multiple_choice_translation') {
      expect(ex.prompt).toBe('welcome')
      expect(ex.choices).toEqual(['de nada', 'bem-vindo', 'obrigado'])
      expect(ex.correctChoice).toBe('bem-vindo')
    }
  })

  it('lowercases dialogue text and choices but preserves speaker names', () => {
    const ex = lesson.exercises.find((e) => e.id === 'ex4')!
    if (ex.type === 'dialogue_choice') {
      expect(ex.dialogue[0].text).toBe('chá ou café?')
      expect(ex.dialogue[0].speaker).toBe('Garçom') // NOT lowercased
      expect(ex.choices).toEqual(['chá, por favor.', 'bem-vindo!'])
      expect(ex.correctChoice).toBe('chá, por favor.')
    }
  })

  it('lowercases listening_tap tokenBank and correctSequence', () => {
    const ex = lesson.exercises.find((e) => e.id === 'ex5')!
    if (ex.type === 'listening_tap') {
      expect(ex.tokenBank).toEqual(['chá', 'café', 'água'])
      expect(ex.correctSequence).toEqual(['chá'])
    }
  })

  it('does NOT lowercase metadata fields (instruction, meaning)', () => {
    const ex = lesson.exercises[0]
    expect(ex.instruction).toBe('Selecione a imagem correta')
    expect(ex.meaning).toBe('Cadeira')
  })
})
