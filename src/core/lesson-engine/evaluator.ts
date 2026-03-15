import type { EvaluationResult, Exercise, UserAnswer } from '@/core/lesson-engine/types'

const normalizeWord = (value: string): string => value.trim().toLowerCase()

const normalizeSequence = (value: string[]): string[] => value.map(normalizeWord)

export const evaluateExercise = (
  exercise: Exercise,
  userAnswer: UserAnswer,
): EvaluationResult => {
  switch (exercise.type) {
    case 'select_image': {
      const answer = userAnswer.type === 'select_image' ? userAnswer.optionId : ''
      const isCorrect = answer === exercise.correctOptionId
      return {
        isCorrect,
        correctAnswer: exercise.correctOptionId,
        explanation: exercise.explanation,
        meaning: exercise.meaning,
      }
    }
    case 'token_translate': {
      const sequence = userAnswer.type === 'token_translate' ? userAnswer.sequence : []
      const isCorrect =
        JSON.stringify(normalizeSequence(sequence)) ===
        JSON.stringify(normalizeSequence(exercise.correctSequence))
      return {
        isCorrect,
        correctAnswer: exercise.correctSequence,
        explanation: exercise.explanation,
        meaning: exercise.meaning,
      }
    }
    case 'multiple_choice_translation': {
      const choice = userAnswer.type === 'multiple_choice_translation' ? userAnswer.choice : ''
      const isCorrect = normalizeWord(choice) === normalizeWord(exercise.correctChoice)
      return {
        isCorrect,
        correctAnswer: exercise.correctChoice,
        explanation: exercise.explanation,
        meaning: exercise.meaning,
      }
    }
    case 'dialogue_choice': {
      const choice = userAnswer.type === 'dialogue_choice' ? userAnswer.choice : ''
      const isCorrect = normalizeWord(choice) === normalizeWord(exercise.correctChoice)
      return {
        isCorrect,
        correctAnswer: exercise.correctChoice,
        explanation: exercise.explanation,
        meaning: exercise.meaning,
      }
    }
    case 'listening_tap': {
      const sequence = userAnswer.type === 'listening_tap' ? userAnswer.sequence : []
      const isCorrect =
        JSON.stringify(normalizeSequence(sequence)) ===
        JSON.stringify(normalizeSequence(exercise.correctSequence))
      return {
        isCorrect,
        correctAnswer: exercise.correctSequence,
        explanation: exercise.explanation,
        meaning: exercise.meaning,
      }
    }
    default: {
      const neverExercise: never = exercise
      throw new Error(`Unsupported exercise type: ${JSON.stringify(neverExercise)}`)
    }
  }
}
