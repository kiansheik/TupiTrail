/**
 * Tests that pathNodes are correctly rebuilt from pathNodesSeed on store
 * rehydration — the core mechanism that lets users see new/removed lessons
 * without clearing localStorage.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { pathNodesSeed } from '@/data/course'
import { rebuildPathNodes } from './migrations'

// ─── Unit: rebuildPathNodes ──────────────────────────────────────────────────

describe('rebuildPathNodes', () => {
  it('adds new lessons from seed that are missing in existing', () => {
    // User only has node-1 in localStorage, but seed has 2 nodes
    const stale = [
      {
        id: 'node-1',
        unitId: 'unit1',
        lessonId: 'unit1-lesson1',
        unlocked: true,
        completed: false,
      },
    ]

    const result = rebuildPathNodes(stale)

    expect(result).toHaveLength(pathNodesSeed.length)
    expect(result.map((n) => n.lessonId)).toEqual(pathNodesSeed.map((n) => n.lessonId))
  })

  it('preserves completion and unlock state from existing nodes', () => {
    const stale = [
      {
        id: 'node-1',
        unitId: 'unit1',
        lessonId: 'unit1-lesson1',
        unlocked: true,
        completed: true,
      },
    ]

    const result = rebuildPathNodes(stale)

    expect(result[0].completed).toBe(true)
    expect(result[0].unlocked).toBe(true)
  })

  it('unlocks the next node when previous is completed (unlock chain)', () => {
    const stale = [
      {
        id: 'node-1',
        unitId: 'unit1',
        lessonId: 'unit1-lesson1',
        unlocked: true,
        completed: true,
      },
    ]

    const result = rebuildPathNodes(stale)

    // The second node should be auto-unlocked because the first is completed
    if (result.length > 1) {
      expect(result[1].unlocked).toBe(true)
    }
  })

  it('drops stale nodes that are no longer in the seed', () => {
    const stale = [
      {
        id: 'node-1',
        unitId: 'unit1',
        lessonId: 'unit1-lesson1',
        unlocked: true,
        completed: true,
      },
      {
        id: 'node-old',
        unitId: 'unit1',
        lessonId: 'deleted-lesson',
        unlocked: true,
        completed: false,
      },
    ]

    const result = rebuildPathNodes(stale)

    expect(result).toHaveLength(pathNodesSeed.length)
    expect(result.find((n) => n.lessonId === 'deleted-lesson')).toBeUndefined()
  })
})

// ─── Integration: store rehydration ──────────────────────────────────────────

describe('store rehydration syncs pathNodes from seed', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('rebuilds pathNodes when localStorage has stale data', async () => {
    // Simulate a user whose localStorage only has lesson1 (before a new lesson was imported)
    const staleStore = {
      state: {
        profile: {
          visitorId: 'test-visitor',
          createdAt: '2026-01-01T00:00:00Z',
          targetCourse: 'tupi',
          uiLanguage: 'pt-BR',
          notificationsRequested: false,
          notificationsGranted: false,
          installedPromptSeen: false,
        },
        progress: {
          totalXp: 150,
          gems: 45,
          streak: { current: 3, lastActiveDate: '2026-03-15', week: {} },
          currentMapPosition: { unitId: 'unit1', lessonId: 'unit1-lesson1' },
          completedLessons: {
            'unit1-lesson1': {
              completedAt: '2026-03-15T10:00:00Z',
              accuracy: 0.9,
              xpEarned: 150,
              durationSec: 120,
              bestCombo: 5,
            },
          },
          unlockedLessons: ['unit1-lesson1'],
          pathNodes: [
            {
              id: 'node-1',
              unitId: 'unit1',
              lessonId: 'unit1-lesson1',
              x: 0,
              y: 0,
              type: 'lesson',
              unlocked: true,
              completed: true,
            },
          ],
        },
        onboardingCompleted: true,
        lessonResume: null,
      },
      version: 5, // old version — triggers migration
    }

    localStorage.setItem('tupi-trail-app', JSON.stringify(staleStore))

    // Dynamically import to get a fresh store instance
    const { useAppStore } = await import('./useAppStore')

    // Wait for async hydration to complete
    await vi.waitFor(() => {
      const state = useAppStore.getState()
      // Should have all nodes from the current seed, not just the 1 from localStorage
      expect(state.progress.pathNodes).toHaveLength(pathNodesSeed.length)
    })

    const state = useAppStore.getState()

    // Existing progress is preserved
    expect(state.progress.totalXp).toBe(150)
    expect(state.progress.gems).toBe(45)

    // First node preserves completion state
    expect(state.progress.pathNodes[0].lessonId).toBe('unit1-lesson1')
    expect(state.progress.pathNodes[0].completed).toBe(true)

    // New node from seed appears, unlocked by chain
    if (pathNodesSeed.length > 1) {
      expect(state.progress.pathNodes[1].lessonId).toBe(pathNodesSeed[1].lessonId)
      expect(state.progress.pathNodes[1].unlocked).toBe(true)
    }
  })

  it('rebuilds pathNodes even when version matches (onRehydrateStorage)', async () => {
    // Same version as current code — migration WON'T run, but onRehydrateStorage should
    const { APP_STORE_VERSION } = await import('./migrations')

    const staleStore = {
      state: {
        profile: {
          visitorId: 'test-visitor',
          createdAt: '2026-01-01T00:00:00Z',
          targetCourse: 'tupi',
          uiLanguage: 'pt-BR',
          notificationsRequested: false,
          notificationsGranted: false,
          installedPromptSeen: false,
        },
        progress: {
          totalXp: 0,
          gems: 30,
          streak: { current: 0, lastActiveDate: null, week: {} },
          currentMapPosition: { unitId: 'unit1', lessonId: 'unit1-lesson1' },
          completedLessons: {},
          unlockedLessons: ['unit1-lesson1'],
          pathNodes: [
            {
              id: 'node-1',
              unitId: 'unit1',
              lessonId: 'unit1-lesson1',
              x: 0,
              y: 0,
              type: 'lesson',
              unlocked: true,
              completed: false,
            },
          ],
        },
        onboardingCompleted: false,
        lessonResume: null,
      },
      version: APP_STORE_VERSION, // SAME version — no migration
    }

    localStorage.setItem('tupi-trail-app', JSON.stringify(staleStore))

    vi.resetModules()
    const { useAppStore } = await import('./useAppStore')

    await vi.waitFor(() => {
      const state = useAppStore.getState()
      expect(state.progress.pathNodes).toHaveLength(pathNodesSeed.length)
    })

    const state = useAppStore.getState()
    expect(state.progress.pathNodes[0].lessonId).toBe('unit1-lesson1')
    if (pathNodesSeed.length > 1) {
      expect(state.progress.pathNodes[1].lessonId).toBe(pathNodesSeed[1].lessonId)
    }
  })
})
