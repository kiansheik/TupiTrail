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

type DraftByExerciseSnapshot = Record<
  string,
  {
    selectImage: string | null
    choice: string | null
    tokens: string[]
  }
>

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
  restoreLesson: (lesson: LessonData, resume: LessonResumeState) => void
  submitAnswer: (answer: UserAnswer) => EvaluationResult | null
  continueAfterFeedback: () => void
  beginReview: () => void
  getCurrentExercise: () => Exercise | null
  clearFeedback: () => void
  buildLessonResult: () => LessonResult | null
  toResumeState: (draftByExercise?: DraftByExerciseSnapshot) => LessonResumeState | null
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

const normalizeQueueState = (queueState: LessonQueueState, lesson: LessonData): LessonQueueState => {
  const validIds = new Set(lesson.exercises.map((exercise) => exercise.id))
  const mainQueue = queueState.mainQueue.filter((id) => validIds.has(id))
  const fallbackMainQueue = mainQueue.length > 0 ? mainQueue : lesson.exercises.map((exercise) => exercise.id)
  const reviewQueue = queueState.reviewQueue.filter((id) => validIds.has(id))
  const firstPassMistakes = queueState.firstPassMistakes.filter((id) => validIds.has(id))

  const mistakeSet = Object.fromEntries(
    Object.entries(queueState.mistakeSet).filter(([id, value]) => validIds.has(id) && Boolean(value)),
  )

  const mainIndex = Math.max(0, Math.min(queueState.mainIndex, fallbackMainQueue.length))
  const phase =
    queueState.phase === 'review' && reviewQueue.length === 0
      ? 'complete'
      : queueState.phase === 'main' && mainIndex >= fallbackMainQueue.length
        ? reviewQueue.length > 0
          ? 'review'
          : 'complete'
        : queueState.phase

  return {
    phase,
    mainQueue: fallbackMainQueue,
    mainIndex,
    reviewQueue,
    firstPassMistakes,
    mistakeSet,
  }
}

const buildQueueStateFromLegacyResume = (
  lesson: LessonData,
  resume: LessonResumeState,
): LessonQueueState => {
  const defaultQueue = createLessonQueueState(lesson.exercises.map((exercise) => exercise.id))
  const legacyQueue = Array.isArray(resume.queue) && resume.queue.length > 0 ? resume.queue : defaultQueue.mainQueue
  const firstPassMistakes = Array.isArray(resume.firstPassMistakes) ? resume.firstPassMistakes : []
  const mistakeSet = Object.fromEntries(firstPassMistakes.map((id) => [id, true] as const))
  const safeIndex = Math.max(0, Math.min(resume.currentIndex ?? 0, legacyQueue.length))

  const phase = resume.needsMistakeIntro
    ? 'review'
    : legacyQueue.length > 0 && safeIndex < legacyQueue.length
      ? 'main'
      : firstPassMistakes.length > 0
        ? 'review'
        : 'complete'

  const legacyState: LessonQueueState = {
    phase,
    mainQueue: lesson.exercises.map((exercise) => exercise.id),
    mainIndex: phase === 'main' ? safeIndex : lesson.exercises.length,
    reviewQueue: phase === 'review' ? [...legacyQueue] : [],
    firstPassMistakes,
    mistakeSet,
  }

  return normalizeQueueState(legacyState, lesson)
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

  restoreLesson: (lesson, resume) => {
    const queueState = resume.queueState
      ? normalizeQueueState(
          {
            phase: resume.queueState.phase,
            mainQueue: [...resume.queueState.mainQueue],
            mainIndex: resume.queueState.mainIndex,
            reviewQueue: [...resume.queueState.reviewQueue],
            firstPassMistakes: [...resume.queueState.firstPassMistakes],
            mistakeSet: { ...resume.queueState.mistakeSet },
          },
          lesson,
        )
      : buildQueueStateFromLegacyResume(lesson, resume)

    const normalizedCombo = {
      current: Math.max(0, resume.combo?.current ?? 0),
      best: Math.max(0, resume.combo?.best ?? 0),
    }

    set({
      ...baseState,
      lesson,
      queueState,
      answers: (resume.answers ?? {}) as Record<string, UserAnswer>,
      attempts: { ...(resume.attempts ?? {}) },
      correctByExercise: { ...(resume.correctByExercise ?? {}) },
      firstPassCorrectByExercise: { ...(resume.firstPassCorrectByExercise ?? {}) },
      combo: normalizedCombo,
      startedAt: resume.startedAt,
      needsMistakeIntro:
        Boolean(resume.needsMistakeIntro) && (queueState.phase === 'review' || queueState.phase === 'main'),
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

  toResumeState: (draftByExercise) => {
    const state = get()
    if (!state.lesson || !state.queueState || !state.startedAt) {
      return null
    }

    const queueResume = buildQueueResume(state.queueState)
    return {
      lessonId: state.lesson.id,
      queueState: {
        phase: state.queueState.phase,
        mainQueue: [...state.queueState.mainQueue],
        mainIndex: state.queueState.mainIndex,
        reviewQueue: [...state.queueState.reviewQueue],
        firstPassMistakes: [...state.queueState.firstPassMistakes],
        mistakeSet: { ...state.queueState.mistakeSet },
      },
      answers: state.answers,
      attempts: { ...state.attempts },
      correctByExercise: { ...state.correctByExercise },
      firstPassCorrectByExercise: { ...state.firstPassCorrectByExercise },
      combo: { ...state.combo },
      needsMistakeIntro: state.needsMistakeIntro,
      draftByExercise: draftByExercise
        ? Object.fromEntries(
            Object.entries(draftByExercise).map(([exerciseId, draft]) => [
              exerciseId,
              {
                selectImage: draft.selectImage,
                choice: draft.choice,
                tokens: [...draft.tokens],
              },
            ]),
          )
        : undefined,
      queue: queueResume.queue,
      currentIndex: queueResume.currentIndex,
      firstPassMistakes: [...state.queueState.firstPassMistakes],
      startedAt: state.startedAt,
    }
  },

  reset: () => {
    set({ ...baseState })
  },
}))
