import { describe, expect, it } from 'vitest'

import { randomizeExerciseResponses } from '@/core/lesson-engine/randomizeResponses'
import type { Exercise } from '@/core/lesson-engine/types'

const optionOrderSet = (exercise: Exercise, seeds: string[]): Set<string> => {
  const orders = new Set<string>()
  for (const seed of seeds) {
    const randomized = randomizeExerciseResponses(exercise, seed)
    if (randomized.type === 'select_image') {
      orders.add(randomized.options.map((option) => option.id).join('|'))
    } else if (randomized.type === 'multiple_choice_translation' || randomized.type === 'dialogue_choice') {
      orders.add(randomized.choices.join('|'))
    } else if (randomized.type === 'token_translate' || randomized.type === 'listening_tap') {
      orders.add(randomized.tokenBank.join('|'))
    }
  }
  return orders
}

describe('randomizeExerciseResponses', () => {
  it('keeps order deterministic for same seed and changes across seeds', () => {
    const exercises: Exercise[] = [
      {
        id: 's',
        type: 'select_image',
        instruction: 'pick',
        prompt: 'coffee',
        options: [
          { id: 'coffee', label: 'coffee', imageEmoji: '☕' },
          { id: 'tea', label: 'tea', imageEmoji: '🍵' },
          { id: 'water', label: 'water', imageEmoji: '💧' },
          { id: 'milk', label: 'milk', imageEmoji: '🥛' },
        ],
        correctOptionId: 'coffee',
      },
      {
        id: 'm',
        type: 'multiple_choice_translation',
        instruction: 'choose',
        prompt: 'tea',
        choices: ['cha', 'agua', 'açucar'],
        correctChoice: 'cha',
      },
      {
        id: 'd',
        type: 'dialogue_choice',
        instruction: 'dialogue',
        dialogue: [{ speaker: 'Garçom', text: 'Tea or coffee?' }, { speaker: 'Você', isBlank: true }],
        choices: ['Tea, please.', 'Thank you.', 'Welcome!'],
        correctChoice: 'Tea, please.',
      },
      {
        id: 't',
        type: 'token_translate',
        instruction: 'translate',
        sourceText: [{ text: 'Coffee or tea?' }],
        tokenBank: ['Coffee', 'or', 'tea?', 'please.'],
        correctSequence: ['Coffee', 'or', 'tea?'],
      },
      {
        id: 'l',
        type: 'listening_tap',
        instruction: 'listen',
        tokenBank: ['tea', 'coffee', 'water', 'milk'],
        correctSequence: ['tea'],
      },
    ]

    for (const exercise of exercises) {
      const a = randomizeExerciseResponses(exercise, 'seed-a')
      const aAgain = randomizeExerciseResponses(exercise, 'seed-a')
      expect(a).toEqual(aAgain)

      const orders = optionOrderSet(exercise, ['seed-a', 'seed-b', 'seed-c', 'seed-d', 'seed-e'])
      expect(orders.size).toBeGreaterThan(1)
    }
  })
})
