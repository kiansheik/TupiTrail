export type ComboState = {
  current: number
  best: number
}

export const createComboState = (): ComboState => ({
  current: 0,
  best: 0,
})

export const applyComboResult = (
  state: ComboState,
  isCorrect: boolean,
  countsForCombo: boolean,
): ComboState => {
  if (!countsForCombo) {
    return state
  }

  if (!isCorrect) {
    return {
      ...state,
      current: 0,
    }
  }

  const nextCurrent = state.current + 1
  return {
    current: nextCurrent,
    best: Math.max(state.best, nextCurrent),
  }
}

export const comboMessage = (combo: number): string => {
  if (combo >= 5) {
    return 'Arrasou!'
  }
  if (combo >= 4) {
    return 'Mandou bem!'
  }
  if (combo >= 3) {
    return 'Boa!'
  }
  return ''
}
