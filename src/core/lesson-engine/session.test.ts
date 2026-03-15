import { describe, expect, it } from 'vitest'

import { advanceQueue, createLessonQueueState, getCurrentExerciseId } from '@/core/lesson-engine/session'

describe('lesson queue', () => {
  it('tracks first-pass mistakes in order and enters review', () => {
    let state = createLessonQueueState(['a', 'b', 'c'])

    expect(getCurrentExerciseId(state)).toBe('a')

    state = advanceQueue(state, 'a', false)
    state = advanceQueue(state, 'b', true)
    state = advanceQueue(state, 'c', false)

    expect(state.phase).toBe('review')
    expect(state.firstPassMistakes).toEqual(['a', 'c'])
    expect(state.reviewQueue).toEqual(['a', 'c'])
    expect(getCurrentExerciseId(state)).toBe('a')
  })

  it('requeues failed review exercises to the end until correct', () => {
    let state = createLessonQueueState(['a'])
    state = advanceQueue(state, 'a', false)

    expect(state.phase).toBe('review')
    expect(state.reviewQueue).toEqual(['a'])

    state = advanceQueue(state, 'a', false)
    expect(state.reviewQueue).toEqual(['a'])

    state = advanceQueue(state, 'a', true)
    expect(state.phase).toBe('complete')
    expect(state.reviewQueue).toEqual([])
  })
})
