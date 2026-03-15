import type { Exercise } from '@/core/lesson-engine/types'

const hashSeed = (value: string): number => {
  let hash = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const createRng = (seed: number): (() => number) => {
  let t = seed >>> 0
  return () => {
    t += 0x6d2b79f5
    let x = Math.imul(t ^ (t >>> 15), 1 | t)
    x ^= x + Math.imul(x ^ (x >>> 7), 61 | x)
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296
  }
}

const shuffleBySeed = <T>(items: T[], seedKey: string): T[] => {
  if (items.length <= 1) {
    return items
  }

  const clone = [...items]
  const rng = createRng(hashSeed(seedKey))
  for (let i = clone.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1))
    ;[clone[i], clone[j]] = [clone[j], clone[i]]
  }
  return clone
}

export const randomizeExerciseResponses = (exercise: Exercise, seedKey: string): Exercise => {
  switch (exercise.type) {
    case 'select_image':
      return {
        ...exercise,
        options: shuffleBySeed(exercise.options, `${seedKey}:select-image-options`),
      }
    case 'token_translate':
      return {
        ...exercise,
        tokenBank: shuffleBySeed(exercise.tokenBank, `${seedKey}:token-bank`),
      }
    case 'multiple_choice_translation':
      return {
        ...exercise,
        choices: shuffleBySeed(exercise.choices, `${seedKey}:multiple-choice`),
      }
    case 'dialogue_choice':
      return {
        ...exercise,
        choices: shuffleBySeed(exercise.choices, `${seedKey}:dialogue-choice`),
      }
    case 'listening_tap':
      return {
        ...exercise,
        tokenBank: shuffleBySeed(exercise.tokenBank, `${seedKey}:listening-token-bank`),
      }
    default: {
      const unreachable: never = exercise
      return unreachable
    }
  }
}
