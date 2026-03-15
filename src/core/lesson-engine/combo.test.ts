import { describe, expect, it } from 'vitest'

import { applyComboResult, comboMessage, createComboState } from '@/core/lesson-engine/combo'

describe('combo system', () => {
  it('increments only on counted correct answers and resets on wrong', () => {
    let state = createComboState()

    state = applyComboResult(state, true, true)
    state = applyComboResult(state, true, true)
    state = applyComboResult(state, true, true)

    expect(state.current).toBe(3)
    expect(state.best).toBe(3)

    state = applyComboResult(state, false, true)
    expect(state.current).toBe(0)
    expect(state.best).toBe(3)

    state = applyComboResult(state, true, false)
    expect(state.current).toBe(0)
  })

  it('returns correct messaging thresholds', () => {
    expect(comboMessage(2)).toBe('')
    expect(comboMessage(3)).toBe('Boa!')
    expect(comboMessage(4)).toBe('Mandou bem!')
    expect(comboMessage(6)).toBe('Arrasou!')
  })
})
