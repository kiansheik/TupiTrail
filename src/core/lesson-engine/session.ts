export type QueuePhase = 'main' | 'review' | 'complete'

export type LessonQueueState = {
  phase: QueuePhase
  mainQueue: string[]
  mainIndex: number
  reviewQueue: string[]
  firstPassMistakes: string[]
  mistakeSet: Record<string, boolean>
}

export const createLessonQueueState = (exerciseIds: string[]): LessonQueueState => ({
  phase: 'main',
  mainQueue: exerciseIds,
  mainIndex: 0,
  reviewQueue: [],
  firstPassMistakes: [],
  mistakeSet: {},
})

export const getCurrentExerciseId = (state: LessonQueueState): string | null => {
  if (state.phase === 'main') {
    return state.mainQueue[state.mainIndex] ?? null
  }
  if (state.phase === 'review') {
    return state.reviewQueue[0] ?? null
  }
  return null
}

const toReviewOrComplete = (state: LessonQueueState): LessonQueueState => {
  if (state.reviewQueue.length > 0) {
    return {
      ...state,
      phase: 'review',
    }
  }

  return {
    ...state,
    phase: 'complete',
  }
}

export const advanceQueue = (
  state: LessonQueueState,
  exerciseId: string,
  isCorrect: boolean,
): LessonQueueState => {
  if (state.phase === 'complete') {
    return state
  }

  if (state.phase === 'main') {
    const hasMistake = Boolean(state.mistakeSet[exerciseId])

    const reviewQueue =
      !isCorrect && !hasMistake ? [...state.reviewQueue, exerciseId] : [...state.reviewQueue]

    const firstPassMistakes =
      !isCorrect && !hasMistake
        ? [...state.firstPassMistakes, exerciseId]
        : [...state.firstPassMistakes]

    const mistakeSet =
      !isCorrect && !hasMistake
        ? {
            ...state.mistakeSet,
            [exerciseId]: true,
          }
        : state.mistakeSet

    const nextState: LessonQueueState = {
      ...state,
      reviewQueue,
      firstPassMistakes,
      mistakeSet,
      mainIndex: state.mainIndex + 1,
    }

    if (nextState.mainIndex >= nextState.mainQueue.length) {
      return toReviewOrComplete(nextState)
    }

    return nextState
  }

  const [current, ...remaining] = state.reviewQueue
  if (!current) {
    return {
      ...state,
      phase: 'complete',
      reviewQueue: [],
    }
  }

  if (isCorrect) {
    const nextState: LessonQueueState = {
      ...state,
      reviewQueue: remaining,
    }

    return nextState.reviewQueue.length > 0
      ? nextState
      : {
          ...nextState,
          phase: 'complete',
        }
  }

  return {
    ...state,
    reviewQueue: [...remaining, current],
  }
}
