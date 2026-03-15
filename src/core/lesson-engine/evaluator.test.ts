import { describe, expect, it } from 'vitest'

import { evaluateExercise } from '@/core/lesson-engine/evaluator'
import type { Exercise } from '@/core/lesson-engine/types'

describe('evaluateExercise', () => {
  it('validates select_image answers', () => {
    const exercise: Exercise = {
      id: 's1',
      type: 'select_image',
      instruction: 'pick',
      prompt: 'coffee',
      options: [
        { id: 'coffee', label: 'coffee', imageEmoji: '☕' },
        { id: 'tea', label: 'tea', imageEmoji: '🍵' },
      ],
      correctOptionId: 'coffee',
    }

    const correct = evaluateExercise(exercise, { type: 'select_image', optionId: 'coffee' })
    const wrong = evaluateExercise(exercise, { type: 'select_image', optionId: 'tea' })

    expect(correct.isCorrect).toBe(true)
    expect(wrong.isCorrect).toBe(false)
  })

  it('validates token sequence case-insensitively', () => {
    const exercise: Exercise = {
      id: 't1',
      type: 'token_translate',
      instruction: 'translate',
      sourceText: [{ text: 'Water, please.' }],
      tokenBank: ['Water,', 'please.'],
      correctSequence: ['Water,', 'please.'],
    }

    const result = evaluateExercise(exercise, {
      type: 'token_translate',
      sequence: ['water,', 'Please.'],
    })

    expect(result.isCorrect).toBe(true)
  })

  it('validates multiple choice', () => {
    const exercise: Exercise = {
      id: 'm1',
      type: 'multiple_choice_translation',
      instruction: 'choose',
      prompt: 'please',
      choices: ['por favor', 'obrigado'],
      correctChoice: 'por favor',
    }

    expect(
      evaluateExercise(exercise, {
        type: 'multiple_choice_translation',
        choice: 'POR FAVOR',
      }).isCorrect,
    ).toBe(true)
  })
})
