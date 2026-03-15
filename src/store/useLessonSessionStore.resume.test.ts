import { beforeEach, describe, expect, it } from 'vitest'

import { getCurrentExerciseId } from '@/core/lesson-engine/session'
import type { Exercise, UserAnswer } from '@/core/lesson-engine/types'
import { lessonById } from '@/data/course'
import { useLessonSessionStore } from '@/store/useLessonSessionStore'

const buildCorrectAnswer = (exercise: Exercise): UserAnswer => {
  if (exercise.type === 'select_image') {
    return { type: 'select_image', optionId: exercise.correctOptionId }
  }
  if (exercise.type === 'token_translate') {
    return { type: 'token_translate', sequence: [...exercise.correctSequence] }
  }
  if (exercise.type === 'multiple_choice_translation') {
    return { type: 'multiple_choice_translation', choice: exercise.correctChoice }
  }
  if (exercise.type === 'dialogue_choice') {
    return { type: 'dialogue_choice', choice: exercise.correctChoice }
  }
  return { type: 'listening_tap', sequence: [...exercise.correctSequence] }
}

const buildWrongAnswer = (exercise: Exercise): UserAnswer => {
  if (exercise.type === 'select_image') {
    const wrongOption = exercise.options.find((option) => option.id !== exercise.correctOptionId)
    return { type: 'select_image', optionId: wrongOption?.id ?? exercise.correctOptionId }
  }
  if (exercise.type === 'token_translate') {
    return { type: 'token_translate', sequence: ['__wrong__'] }
  }
  if (exercise.type === 'multiple_choice_translation') {
    const wrong = exercise.choices.find((choice) => choice !== exercise.correctChoice)
    return { type: 'multiple_choice_translation', choice: wrong ?? exercise.correctChoice }
  }
  if (exercise.type === 'dialogue_choice') {
    const wrong = exercise.choices.find((choice) => choice !== exercise.correctChoice)
    return { type: 'dialogue_choice', choice: wrong ?? exercise.correctChoice }
  }
  return { type: 'listening_tap', sequence: ['__wrong__'] }
}

describe('useLessonSessionStore resume', () => {
  const lesson = lessonById.get('unit1-lesson1')

  beforeEach(() => {
    useLessonSessionStore.getState().reset()
  })

  it('restores queue state and attempt history from snapshot', () => {
    expect(lesson).toBeDefined()
    if (!lesson) {
      return
    }

    const session = useLessonSessionStore.getState()
    session.startLesson(lesson)

    const ex1 = lesson.exercises[0]
    const ex2 = lesson.exercises[1]
    const ex3 = lesson.exercises[2]

    session.submitAnswer(buildCorrectAnswer(ex1))
    session.continueAfterFeedback()
    session.submitAnswer(buildWrongAnswer(ex2))
    session.continueAfterFeedback()

    const snapshot = session.toResumeState({
      [ex3.id]: { selectImage: null, choice: null, tokens: ['demo-token'] },
    })
    expect(snapshot).not.toBeNull()
    if (!snapshot) {
      return
    }

    session.reset()
    session.restoreLesson(lesson, snapshot)

    const restored = useLessonSessionStore.getState()
    expect(restored.queueState?.phase).toBe('main')
    expect(restored.queueState?.mainIndex).toBe(2)
    expect(getCurrentExerciseId(restored.queueState!)).toBe(ex3.id)
    expect(restored.attempts[ex1.id]).toBe(1)
    expect(restored.attempts[ex2.id]).toBe(1)
    expect(restored.firstPassCorrectByExercise[ex1.id]).toBe(true)
    expect(restored.firstPassCorrectByExercise[ex2.id]).toBe(false)
    expect(restored.combo.current).toBe(0)
  })

  it('restores completed session and keeps completion summary available', () => {
    expect(lesson).toBeDefined()
    if (!lesson) {
      return
    }

    const session = useLessonSessionStore.getState()
    session.startLesson(lesson)

    for (const exercise of lesson.exercises) {
      session.submitAnswer(buildCorrectAnswer(exercise))
      session.continueAfterFeedback()
    }

    const snapshot = session.toResumeState()
    expect(snapshot).not.toBeNull()
    if (!snapshot) {
      return
    }

    session.reset()
    session.restoreLesson(lesson, snapshot)

    const restored = useLessonSessionStore.getState()
    expect(restored.queueState?.phase).toBe('complete')
    expect(restored.buildLessonResult()).not.toBeNull()
  })

  it('supports legacy resume format fields', () => {
    expect(lesson).toBeDefined()
    if (!lesson) {
      return
    }

    const legacyResume = {
      lessonId: lesson.id,
      queue: lesson.exercises.map((exercise) => exercise.id),
      currentIndex: 3,
      firstPassMistakes: [],
      startedAt: new Date().toISOString(),
    }

    const session = useLessonSessionStore.getState()
    session.restoreLesson(lesson, legacyResume)

    const restored = useLessonSessionStore.getState()
    expect(restored.queueState?.phase).toBe('main')
    expect(restored.queueState?.mainIndex).toBe(3)
    expect(getCurrentExerciseId(restored.queueState!)).toBe(lesson.exercises[3]?.id)
  })
})
