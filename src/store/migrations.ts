import { pathNodesSeed } from '@/data/course'

export const APP_STORE_VERSION = 3

function rebuildPathNodes(existing: Array<Record<string, unknown>>) {
  const existingByLessonId = new Map(existing.map((n) => [n.lessonId as string, n]))

  // Rebuild in seed order: keep unlock/completion from existing, drop nodes not in seed
  return pathNodesSeed.map((seedNode) => {
    const saved = existingByLessonId.get(seedNode.lessonId)
    return saved
      ? { ...seedNode, unlocked: saved.unlocked, completed: saved.completed }
      : { ...seedNode }
  })
}

export const migrateAppStore = (persistedState: unknown, version: number): unknown => {
  const state = persistedState as Record<string, unknown>

  if (version < 3) {
    const progress = state.progress as Record<string, unknown> | undefined
    if (progress) {
      const existing = Array.isArray(progress.pathNodes)
        ? (progress.pathNodes as Array<Record<string, unknown>>)
        : []
      progress.pathNodes = rebuildPathNodes(existing)
    }
  }

  return state
}
