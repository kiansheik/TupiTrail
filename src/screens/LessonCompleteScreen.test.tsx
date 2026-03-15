import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type { Exercise, UserAnswer } from '@/core/lesson-engine/types'
import { lessonById, pathNodesSeed } from '@/data/course'
import { LessonCompleteScreen } from '@/screens/LessonCompleteScreen'
import { useAppStore } from '@/store/useAppStore'
import { useLessonSessionStore } from '@/store/useLessonSessionStore'

vi.mock('@/lib/audio/sfx', () => ({
  playSfx: vi.fn(),
}))

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

const resetStores = () => {
  useLessonSessionStore.getState().reset()
  useAppStore.setState((state) => ({
    progress: {
      ...state.progress,
      totalXp: 0,
      gems: 30,
      streak: {
        current: 0,
        lastActiveDate: null,
        week: {},
      },
      currentMapPosition: {
        unitId: 'unit1',
        lessonId: 'unit1-lesson1',
      },
      completedLessons: {},
      unlockedLessons: ['unit1-lesson1'],
      pathNodes: pathNodesSeed.map((node) => ({ ...node })),
    },
  }))
}

const completeLessonInStore = () => {
  const lesson = lessonById.get('unit1-lesson1')
  expect(lesson).toBeDefined()
  if (!lesson) {
    return
  }

  useLessonSessionStore.getState().startLesson(lesson)

  for (const exercise of lesson.exercises) {
    const result = useLessonSessionStore.getState().submitAnswer(buildCorrectAnswer(exercise))
    expect(result?.isCorrect).toBe(true)
    useLessonSessionStore.getState().continueAfterFeedback()
  }

  expect(useLessonSessionStore.getState().queueState?.phase).toBe('complete')
}

describe('LessonCompleteScreen', () => {
  beforeEach(() => {
    resetStores()
    completeLessonInStore()
  })

  it('renders completion summary and claims XP without crashing', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter initialEntries={['/lesson/unit1-lesson1/complete']}>
        <Routes>
          <Route path="/lesson/:lessonId/complete" element={<LessonCompleteScreen />} />
          <Route path="/streak/ignite" element={<div>STREAK_IGNITE_OK</div>} />
        </Routes>
      </MemoryRouter>,
    )

    expect(screen.getByText('Vitória!')).toBeInTheDocument()
    expect(screen.getByText(/Você concluiu a primeira lição/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Receber XP/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /Receber XP/i }))

    expect(screen.getByText('STREAK_IGNITE_OK')).toBeInTheDocument()

    const appState = useAppStore.getState()
    expect(appState.progress.totalXp).toBeGreaterThan(0)
    expect(appState.progress.completedLessons['unit1-lesson1']).toBeDefined()
  })
})
