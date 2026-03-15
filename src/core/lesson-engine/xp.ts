import type { Exercise } from '@/core/lesson-engine/types'

const DEFAULT_XP = 8

export const xpForExercise = (exercise: Exercise): number => exercise.xp ?? DEFAULT_XP

export const computeEarnedXp = (
  exercises: Exercise[],
  correctExerciseIds: Record<string, boolean>,
): number => {
  return exercises.reduce((sum, exercise) => {
    if (!correctExerciseIds[exercise.id]) {
      return sum
    }
    return sum + xpForExercise(exercise)
  }, 0)
}
