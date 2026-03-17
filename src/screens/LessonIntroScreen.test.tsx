import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import { lessonById } from '@/data/course'
import { LessonIntroScreen } from '@/screens/LessonIntroScreen'
import { useLessonSessionStore } from '@/store/useLessonSessionStore'

vi.mock('@/lib/audio/sfx', () => ({ playSfx: vi.fn() }))

beforeEach(() => {
  useLessonSessionStore.getState().reset()
})

const renderIntro = (lessonId: string) =>
  render(
    <MemoryRouter initialEntries={[`/lesson/${lessonId}/intro`]}>
      <Routes>
        <Route path="/lesson/:lessonId/intro" element={<LessonIntroScreen />} />
        <Route path="/lesson/:lessonId/run" element={<div>RUN_OK:{lessonId}</div>} />
        <Route path="/map" element={<div>MAP_OK</div>} />
      </Routes>
    </MemoryRouter>,
  )

describe('LessonIntroScreen', () => {
  it('renders intro for a valid lessonId', () => {
    renderIntro('unit1-lesson1')
    expect(screen.queryByText('MAP_OK')).not.toBeInTheDocument()
    // Shows the lesson title from the lesson data
    const lesson = lessonById.get('unit1-lesson1')!
    expect(screen.getByText(lesson.title)).toBeInTheDocument()
  })

  it('redirects to /map for a stale/unknown lessonId — never falls back to lesson1', () => {
    // This is the exact bug: node had lessonId 'lesson2' which is not in lessonById
    renderIntro('lesson2')
    expect(screen.getByText('MAP_OK')).toBeInTheDocument()
    // Must NOT start lesson1 silently
    expect(screen.queryByText(/RUN_OK:unit1-lesson1/)).not.toBeInTheDocument()
  })

  it('redirects to /map for any unrecognised lessonId', () => {
    renderIntro('unit99-phantom-lesson')
    expect(screen.getByText('MAP_OK')).toBeInTheDocument()
  })

  it('navigates to the correct /run URL when user clicks Continuar', async () => {
    const user = userEvent.setup()
    // Need a route that captures the dynamic lessonId
    render(
      <MemoryRouter initialEntries={['/lesson/unit1-lesson1/intro']}>
        <Routes>
          <Route path="/lesson/:lessonId/intro" element={<LessonIntroScreen />} />
          <Route path="/lesson/:lessonId/run" element={<div data-testid="run-screen" />} />
          <Route path="/map" element={<div>MAP_OK</div>} />
        </Routes>
      </MemoryRouter>,
    )

    await user.click(screen.getByRole('button', { name: /continuar/i }))
    expect(screen.getByTestId('run-screen')).toBeInTheDocument()
    expect(useLessonSessionStore.getState().lesson?.id).toBe('unit1-lesson1')
  })
})
