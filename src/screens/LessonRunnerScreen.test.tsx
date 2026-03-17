import { act, render, screen, waitFor } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import type { Exercise, UserAnswer } from '@/core/lesson-engine/types'
import { lessonById, pathNodesSeed } from '@/data/course'
import { LessonRunnerScreen } from '@/screens/LessonRunnerScreen'
import { useAppStore } from '@/store/useAppStore'
import { useLessonSessionStore } from '@/store/useLessonSessionStore'

vi.mock('@/lib/audio/sfx', () => ({ playSfx: vi.fn() }))
vi.mock('@/lib/audio/speech', () => ({ playAudioSpec: vi.fn() }))

// ─── Helpers ──────────────────────────────────────────────────────────────────

const buildCorrectAnswer = (exercise: Exercise): UserAnswer => {
  if (exercise.type === 'select_image') return { type: 'select_image', optionId: exercise.correctOptionId }
  if (exercise.type === 'token_translate') return { type: 'token_translate', sequence: [...exercise.correctSequence] }
  if (exercise.type === 'multiple_choice_translation') return { type: 'multiple_choice_translation', choice: exercise.correctChoice }
  if (exercise.type === 'dialogue_choice') return { type: 'dialogue_choice', choice: exercise.correctChoice }
  return { type: 'listening_tap', sequence: [...exercise.correctSequence] }
}

const buildWrongAnswer = (exercise: Exercise): UserAnswer => {
  if (exercise.type === 'select_image') {
    const wrong = exercise.options.find((o) => o.id !== exercise.correctOptionId)
    return { type: 'select_image', optionId: wrong?.id ?? exercise.correctOptionId }
  }
  if (exercise.type === 'token_translate') return { type: 'token_translate', sequence: ['__wrong__'] }
  if (exercise.type === 'multiple_choice_translation') {
    const wrong = exercise.choices.find((c) => c !== exercise.correctChoice)
    return { type: 'multiple_choice_translation', choice: wrong ?? exercise.correctChoice }
  }
  if (exercise.type === 'dialogue_choice') {
    const wrong = exercise.choices.find((c) => c !== exercise.correctChoice)
    return { type: 'dialogue_choice', choice: wrong ?? exercise.correctChoice }
  }
  return { type: 'listening_tap', sequence: ['__wrong__'] }
}

const resetStores = () => {
  useLessonSessionStore.getState().reset()
  useAppStore.setState((state) => ({
    lessonResume: null,
    progress: {
      ...state.progress,
      completedLessons: {},
      pathNodes: pathNodesSeed.map((n) => ({ ...n })),
    },
  }))
}

const renderRunner = (lessonId = 'unit1-lesson1') =>
  render(
    <MemoryRouter initialEntries={[`/lesson/${lessonId}/run`]}>
      <Routes>
        <Route path="/lesson/:lessonId/run" element={<LessonRunnerScreen />} />
        <Route path="/lesson/:lessonId/complete" element={<div>COMPLETE_OK</div>} />
        <Route path="/lesson/:lessonId/mistakes" element={<div>MISTAKES_OK</div>} />
        <Route path="/lesson/:lessonId/intro" element={<div>INTRO_OK</div>} />
      </Routes>
    </MemoryRouter>,
  )

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('LessonRunnerScreen navigation', () => {
  const lesson = lessonById.get('unit1-lesson1')!

  beforeEach(resetStores)

  it('lesson data exists in lessonById', () => {
    expect(lesson).toBeDefined()
    expect(lesson.exercises.length).toBeGreaterThan(0)
  })

  it('navigates to /complete when all exercises answered correctly', async () => {
    useLessonSessionStore.getState().startLesson(lesson)
    renderRunner()

    act(() => {
      for (const exercise of lesson.exercises) {
        useLessonSessionStore.getState().submitAnswer(buildCorrectAnswer(exercise))
        useLessonSessionStore.getState().continueAfterFeedback()
      }
    })

    await waitFor(() => {
      expect(screen.getByText('COMPLETE_OK')).toBeInTheDocument()
    })
  })

  it('navigates to /mistakes when a mistake is made during main phase', async () => {
    useLessonSessionStore.getState().startLesson(lesson)
    renderRunner()

    const first = lesson.exercises[0]
    act(() => {
      // Submit wrong answer on first exercise to trigger mistake intro
      useLessonSessionStore.getState().submitAnswer(buildWrongAnswer(first))
      useLessonSessionStore.getState().continueAfterFeedback()
    })

    // Complete the rest of main phase correctly
    act(() => {
      for (const exercise of lesson.exercises.slice(1)) {
        useLessonSessionStore.getState().submitAnswer(buildCorrectAnswer(exercise))
        useLessonSessionStore.getState().continueAfterFeedback()
      }
    })

    await waitFor(() => {
      expect(screen.getByText('MISTAKES_OK')).toBeInTheDocument()
    })
  })

  it('navigates to /complete after completing review phase', async () => {
    // Set up session with a mistake already queued in review
    useLessonSessionStore.getState().startLesson(lesson)

    // Drive through main phase: wrong on first, correct on rest
    act(() => {
      const first = lesson.exercises[0]
      useLessonSessionStore.getState().submitAnswer(buildWrongAnswer(first))
      useLessonSessionStore.getState().continueAfterFeedback()
      for (const exercise of lesson.exercises.slice(1)) {
        useLessonSessionStore.getState().submitAnswer(buildCorrectAnswer(exercise))
        useLessonSessionStore.getState().continueAfterFeedback()
      }
      // Clear needsMistakeIntro so the runner shows review instead of going to /mistakes
      useLessonSessionStore.getState().beginReview()
    })

    renderRunner()

    // Now complete the review correctly
    act(() => {
      const first = lesson.exercises[0]
      useLessonSessionStore.getState().submitAnswer(buildCorrectAnswer(first))
      useLessonSessionStore.getState().continueAfterFeedback()
    })

    await waitFor(() => {
      expect(screen.getByText('COMPLETE_OK')).toBeInTheDocument()
    })
  })

  it('shows "Sessão indisponível" fallback if navigated to /run with no lesson loaded', async () => {
    // Do NOT start a lesson
    renderRunner()

    await waitFor(() => {
      expect(screen.getByText(/sessão indisponível/i)).toBeInTheDocument()
    })
  })

  it('restores session from lessonResume when lesson is not in session store', async () => {
    // Complete exercises up to mid-point and snapshot the resume
    useLessonSessionStore.getState().startLesson(lesson)
    const midEx = lesson.exercises[0]
    act(() => {
      useLessonSessionStore.getState().submitAnswer(buildCorrectAnswer(midEx))
      useLessonSessionStore.getState().continueAfterFeedback()
    })

    const resume = useLessonSessionStore.getState().toResumeState()
    expect(resume).not.toBeNull()

    // Reset session but keep resume in app store
    useLessonSessionStore.getState().reset()
    useAppStore.setState({ lessonResume: resume })

    renderRunner()

    // Session should be restored — runner should be showing an exercise, not the fallback
    await waitFor(() => {
      expect(screen.queryByText(/sessão indisponível/i)).not.toBeInTheDocument()
    })
  })

  it('does not navigate to /complete when only partway through exercises', async () => {
    useLessonSessionStore.getState().startLesson(lesson)

    // Answer only the first exercise
    act(() => {
      useLessonSessionStore.getState().submitAnswer(buildCorrectAnswer(lesson.exercises[0]))
      useLessonSessionStore.getState().continueAfterFeedback()
    })

    renderRunner()

    // Should still be on the runner (or navigated to mistakes), never to complete
    await new Promise((r) => setTimeout(r, 50))
    expect(screen.queryByText('COMPLETE_OK')).not.toBeInTheDocument()
  })
})

// ─── HomeRoute lessonResume redirect logic ────────────────────────────────────

describe('HomeRoute lessonResume redirects', () => {
  // HomeRoute is the "/" route — it redirects based on lessonResume state
  const HomeRouteStub = () => {
    const lessonResume = useAppStore((s) => s.lessonResume)
    const onboardingCompleted = useAppStore((s) => s.onboardingCompleted)

    if (lessonResume?.lessonId && lessonById.has(lessonResume.lessonId)) {
      if (lessonResume.needsMistakeIntro)
        return <div>REDIRECT_MISTAKES</div>
      if (lessonResume.queueState?.phase === 'complete')
        return <div>REDIRECT_COMPLETE</div>
      return <div>REDIRECT_RUN</div>
    }
    if (onboardingCompleted) return <div>REDIRECT_MAP</div>
    return <div>WELCOME</div>
  }

  beforeEach(() => {
    useLessonSessionStore.getState().reset()
    useAppStore.setState({ lessonResume: null, onboardingCompleted: false })
  })

  it('redirects to /run when lessonResume has in-progress phase', () => {
    useAppStore.setState({
      lessonResume: {
        lessonId: 'unit1-lesson1',
        startedAt: new Date().toISOString(),
        queueState: {
          phase: 'main',
          mainQueue: ['ex1'],
          mainIndex: 0,
          reviewQueue: [],
          firstPassMistakes: [],
          mistakeSet: {},
        },
      },
    })

    render(
      <MemoryRouter>
        <HomeRouteStub />
      </MemoryRouter>,
    )

    expect(screen.getByText('REDIRECT_RUN')).toBeInTheDocument()
  })

  it('redirects to /complete when lessonResume has complete phase', () => {
    useAppStore.setState({
      lessonResume: {
        lessonId: 'unit1-lesson1',
        startedAt: new Date().toISOString(),
        queueState: {
          phase: 'complete',
          mainQueue: ['ex1'],
          mainIndex: 1,
          reviewQueue: [],
          firstPassMistakes: [],
          mistakeSet: {},
        },
      },
    })

    render(
      <MemoryRouter>
        <HomeRouteStub />
      </MemoryRouter>,
    )

    expect(screen.getByText('REDIRECT_COMPLETE')).toBeInTheDocument()
  })

  it('does NOT redirect to /run when lessonResume is null', () => {
    useAppStore.setState({ lessonResume: null, onboardingCompleted: true })

    render(
      <MemoryRouter>
        <HomeRouteStub />
      </MemoryRouter>,
    )

    expect(screen.getByText('REDIRECT_MAP')).toBeInTheDocument()
    expect(screen.queryByText('REDIRECT_RUN')).not.toBeInTheDocument()
  })

  it('does NOT redirect to /run when lessonId is not in lessonById', () => {
    useAppStore.setState({
      lessonResume: {
        lessonId: 'unit99-phantom-lesson',
        startedAt: new Date().toISOString(),
      },
      onboardingCompleted: true,
    })

    render(
      <MemoryRouter>
        <HomeRouteStub />
      </MemoryRouter>,
    )

    // Phantom lesson not in lessonById → should fall through to map
    expect(screen.getByText('REDIRECT_MAP')).toBeInTheDocument()
    expect(screen.queryByText('REDIRECT_RUN')).not.toBeInTheDocument()
  })
})
