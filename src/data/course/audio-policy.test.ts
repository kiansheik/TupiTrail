import { describe, expect, it } from 'vitest'

import { courseEn } from '@/data/course'

describe('course audio policy', () => {
  it('uses repository file audio for configured exercise audio', () => {
    for (const unit of courseEn.units) {
      for (const lesson of unit.lessons) {
        for (const exercise of lesson.exercises) {
          if (exercise.audio) {
            expect(exercise.audio.mode).toBe('file')
            if (exercise.audio.mode === 'file') {
              expect(exercise.audio.src.startsWith('/audio/')).toBe(true)
              expect(exercise.audio.required).not.toBe(false)
            }
          }

          if (exercise.slowAudio) {
            expect(exercise.slowAudio.mode).toBe('file')
            if (exercise.slowAudio.mode === 'file') {
              expect(exercise.slowAudio.src.startsWith('/audio/')).toBe(true)
            }
          }
        }
      }
    }
  })
})
