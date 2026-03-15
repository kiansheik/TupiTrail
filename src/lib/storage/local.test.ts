import { describe, expect, it, beforeEach } from 'vitest'

import { readLocal, removeLocal, writeLocal } from '@/lib/storage/local'

describe('local storage helpers', () => {
  beforeEach(() => {
    window.localStorage.clear()
  })

  it('writes and reads JSON values', () => {
    writeLocal('demo', { xp: 10 })
    expect(readLocal('demo', { xp: 0 })).toEqual({ xp: 10 })
  })

  it('returns fallback when value is missing or invalid', () => {
    expect(readLocal('missing', { ok: false })).toEqual({ ok: false })

    window.localStorage.setItem('broken', '{')
    expect(readLocal('broken', { ok: true })).toEqual({ ok: true })
  })

  it('removes items', () => {
    writeLocal('remove-me', [1, 2, 3])
    removeLocal('remove-me')
    expect(readLocal('remove-me', [])).toEqual([])
  })
})
