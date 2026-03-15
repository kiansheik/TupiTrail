import { create } from 'zustand'

import { applyComboResult, createComboState } from '@/core/lesson-engine/combo'
import { evaluateExercise } from '@/core/lesson-engine/evaluator'
import { computeAccuracy, computeDurationSec } from '@/core/lesson-engine/progress'
import {
  advanceQueue,
  createLessonQueueState,
  getCurrentExerciseId,
  type LessonQueueState,
} from '@/core/lesson-engine/session'
import { computeEarnedXp } from '@/core/lesson-engine/xp'
import type { EvaluationResult, Exercise, LessonData, LessonResult, UserAnswer } from '@/core/lesson-engine/types'
import type { LessonResumeState } from '@/store/useAppStore'
import { nowIso } from '@/lib/utils/time'

type FeedbackState = {
  exerciseId: string
  result: EvaluationResult
}

type LessonSessionState = {
  lesson: LessonData | null
  queueState: LessonQueueState | null
  answers: Record<string, UserAnswer>
  attempts: Record<string, number>
  correctByExercise: Record<string, boolean>
  firstPassCorrectByExercise: Record<string, boolean>
  combo: {
    current: number
    best: number
  }
  startedAt: string | null
  feedback: FeedbackState | null
  needsMistakeIntro: boolean
  startLesson: (lesson: LessonData) => void
  submitAnswer: (answer: UserAnswer) => EvaluationResult | null
  continueAfterFeedback: () => void
  beginReview: () => void
  getCurrentExercise: () => Exercise | null
  clearFeedback: () => void
  buildLessonResult: () => LessonResult | null
  toResumeState: () => LessonResumeState | null
  reset: () => void
}

const buildQueueResume = (queueState: LessonQueueState): { queue: string[]; currentIndex: number } => {
  if (queueState.phase === 'main') {
    return {
      queue: [...queueState.mainQueue],
      currentIndex: queueState.mainIndex,
    }
  }

  return {
    queue: [...queueState.reviewQueue],
    currentIndex: 0,
  }
}

const baseState = {
  lesson: null,
  queueState: null,
  answers: {},
  attempts: {},
  correctByExercise: {},
  firstPassCorrectByExercise: {},
  combo: createComboState(),
  startedAt: null,
  feedback: null,
  needsMistakeIntro: false,
}

export const useLessonSessionStore = create<LessonSessionState>((set, get) => ({
  ...baseState,

  startLesson: (lesson) => {
    set({
      ...baseState,
      lesson,
      queueState: createLessonQueueState(lesson.exercises.map((exercise) => exercise.id)),
      startedAt: nowIso(),
    })
  },

  submitAnswer: (answer) => {
    const state = get()
    const queue = state.queueState
    const lesson = state.lesson

    if (!queue || !lesson) {
      return null
    }

    const currentExerciseId = getCurrentExerciseId(queue)
    if (!currentExerciseId) {
      return null
    }

    const exercise = lesson.exercises.find((item) => item.id === currentExerciseId)
    if (!exercise) {
      return null
    }

    const result = evaluateExercise(exercise, answer)
    const previousAttempts = state.attempts[currentExerciseId] ?? 0
    const attemptNumber = previousAttempts + 1
    const firstPassAttempt = queue.phase === 'main' && previousAttempts === 0
    const combo = applyComboResult(state.combo, result.isCorrect, firstPassAttempt)

    set({
      answers: {
        ...state.answers,
        [currentExerciseId]: answer,
      },
      attempts: {
        ...state.attempts,
        [currentExerciseId]: attemptNumber,
      },
      correctByExercise: result.isCorrect
        ? {
            ...state.correctByExercise,
            [currentExerciseId]: true,
          }
        : state.correctByExercise,
      firstPassCorrectByExercise: firstPassAttempt
        ? {
            ...state.firstPassCorrectByExercise,
            [currentExerciseId]: result.isCorrect,
          }
        : state.firstPassCorrectByExercise,
      combo,
      feedback: {
        exerciseId: currentExerciseId,
        result,
      },
    })

    return result
  },

  continueAfterFeedback: () => {
    const state = get()
    const queue = state.queueState
    const feedback = state.feedback

    if (!queue || !feedback) {
      return
    }

    const nextQueue = advanceQueue(queue, feedback.exerciseId, feedback.result.isCorrect)
    const movedToReview = queue.phase === 'main' && nextQueue.phase === 'review'

    set({
      queueState: nextQueue,
      feedback: null,
      needsMistakeIntro: movedToReview,
    })
  },

  beginReview: () => {
    set({ needsMistakeIntro: false })
  },

  getCurrentExercise: () => {
    const state = get()
    const queue = state.queueState
    const lesson = state.lesson

    if (!queue || !lesson) {
      return null
    }

    const currentExerciseId = getCurrentExerciseId(queue)
    if (!currentExerciseId) {
      return null
    }

    return lesson.exercises.find((exercise) => exercise.id === currentExerciseId) ?? null
  },

  clearFeedback: () => {
    set({ feedback: null })
  },

  buildLessonResult: () => {
    const state = get()
    const lesson = state.lesson
    const queueState = state.queueState

    if (!lesson || !queueState || queueState.phase !== 'complete') {
      return null
    }

    const firstPassCorrectCount = lesson.exercises.reduce((sum, exercise) => {
      if (state.firstPassCorrectByExercise[exercise.id]) {
        return sum + 1
      }
      return sum
    }, 0)

    const accuracy = computeAccuracy(firstPassCorrectCount, lesson.exercises.length)
    const xpEarned = computeEarnedXp(lesson.exercises, state.correctByExercise)
    const durationSec = computeDurationSec(state.startedAt ?? nowIso())

    return {
      lessonId: lesson.id,
      accuracy,
      xpEarned,
      durationSec,
      bestCombo: state.combo.best,
    }
  },

  toResumeState: () => {
    const state = get()
    if (!state.lesson || !state.queueState || !state.startedAt) {
      return null
    }

    const queueResume = buildQueueResume(state.queueState)
    return {
      lessonId: state.lesson.id,
      queue: queueResume.queue,
      currentIndex: queueResume.currentIndex,
      answers: state.answers,
      firstPassMistakes: [...state.queueState.firstPassMistakes],
      startedAt: state.startedAt,
    }
  },

  reset: () => {
    set({ ...baseState })
  },
}))
