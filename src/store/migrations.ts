import { pathNodesSeed } from '@/data/course'

export const APP_STORE_VERSION = 13

export function rebuildPathNodes(existing: Array<Record<string, unknown>>) {
  const existingByLessonId = new Map(existing.map((n) => [n.lessonId as string, n]))

  // Rebuild in seed order: keep unlock/completion from existing, drop nodes not in seed
  const nodes = pathNodesSeed.map((seedNode) => {
    const saved = existingByLessonId.get(seedNode.lessonId)
    return saved
      ? { ...seedNode, unlocked: Boolean(saved.unlocked), completed: Boolean(saved.completed) }
      : { ...seedNode }
  })

  // Ensure unlock chain: if a node is completed, the next node must be unlocked.
  // This handles cases where lessonIds changed and the saved unlock state was lost.
  for (let i = 0; i < nodes.length - 1; i++) {
    if (nodes[i].completed && !nodes[i + 1].unlocked) {
      nodes[i + 1] = { ...nodes[i + 1], unlocked: true }
    }
  }

  return nodes
}

export const migrateAppStore = (persistedState: unknown, version: number): unknown => {
  const state = persistedState as Record<string, unknown>

  if (version < 13) {
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
