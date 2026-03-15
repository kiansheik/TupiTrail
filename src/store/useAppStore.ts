import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import type { LessonResult } from '@/core/lesson-engine/types'
import { pathNodesSeed } from '@/data/course'
import { getCookie, setCookie } from '@/lib/storage/cookie'
import { isoToday, nowIso } from '@/lib/utils/time'
import { APP_STORE_VERSION, migrateAppStore } from '@/store/migrations'

export type AppProfile = {
  visitorId: string
  createdAt: string
  displayName?: string
  targetCourse: 'tupi'
  uiLanguage: 'pt-BR' | 'en'
  notificationsRequested: boolean
  notificationsGranted: boolean
  confidenceLevel?: 'level1' | 'level2' | 'level3'
  streakGoalDays?: 3 | 5 | 7
  installedPromptSeen: boolean
}

export type AppProgress = {
  totalXp: number
  gems: number
  streak: {
    current: number
    lastActiveDate: string | null
    week: Record<string, boolean>
  }
  currentMapPosition: {
    unitId: string
    lessonId: string
  }
  completedLessons: Record<
    string,
    {
      completedAt: string
      accuracy: number
      xpEarned: number
      durationSec: number
      bestCombo: number
    }
  >
  unlockedLessons: string[]
  pathNodes: ReturnType<typeof getDefaultPathNodes>
}

export type LessonResumeState = {
  lessonId: string
  startedAt: string
  queueState?: {
    phase: 'main' | 'review' | 'complete'
    mainQueue: string[]
    mainIndex: number
    reviewQueue: string[]
    firstPassMistakes: string[]
    mistakeSet: Record<string, boolean>
  }
  answers?: Record<string, unknown>
  attempts?: Record<string, number>
  correctByExercise?: Record<string, boolean>
  firstPassCorrectByExercise?: Record<string, boolean>
  combo?: {
    current: number
    best: number
  }
  needsMistakeIntro?: boolean
  draftByExercise?: Record<
    string,
    {
      selectImage: string | null
      choice: string | null
      tokens: string[]
    }
  >
  // Legacy fallback fields (v1 snapshots):
  queue?: string[]
  currentIndex?: number
  firstPassMistakes?: string[]
}

type AppState = {
  profile: AppProfile
  progress: AppProgress
  onboardingCompleted: boolean
  lessonResume: LessonResumeState | null
  completeOnboarding: () => void
  setConfidenceLevel: (value: AppProfile['confidenceLevel']) => void
  setNotificationPreference: (requested: boolean, granted: boolean) => void
  setStreakGoal: (goal: 3 | 5 | 7) => void
  markInstallPromptSeen: () => void
  saveLessonResume: (resume: LessonResumeState | null) => void
  applyLessonResult: (result: LessonResult) => void
  awardGems: (amount: number) => void
}

const createVisitorId = (): string => {
  const existing = getCookie('tupi_visitor_id')
  if (existing) {
    return existing
  }

  const generated = crypto.randomUUID()
  setCookie('tupi_visitor_id', generated)
  return generated
}

const getDefaultPathNodes = () => pathNodesSeed

const defaultProfile: AppProfile = {
  visitorId: createVisitorId(),
  createdAt: nowIso(),
  targetCourse: 'tupi',
  uiLanguage: 'pt-BR',
  notificationsRequested: false,
  notificationsGranted: false,
  installedPromptSeen: false,
}

const defaultProgress: AppProgress = {
  totalXp: 0,
  gems: 30,
  streak: {
    current: 0,
    lastActiveDate: null,
    week: {},
  },
  currentMapPosition: {
    unitId: 'unit1',
    lessonId: 'unit1-lesson1',
  },
  completedLessons: {},
  unlockedLessons: ['unit1-lesson1'],
  pathNodes: getDefaultPathNodes(),
}

const updateStreak = (progress: AppProgress): AppProgress => {
  const today = isoToday()
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const last = progress.streak.lastActiveDate

  let current = progress.streak.current
  if (last === today) {
    current = progress.streak.current
  } else if (last === yesterday) {
    current = progress.streak.current + 1
  } else {
    current = 1
  }

  return {
    ...progress,
    streak: {
      current,
      lastActiveDate: today,
      week: {
        ...progress.streak.week,
        [today]: true,
      },
    },
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      profile: defaultProfile,
      progress: defaultProgress,
      onboardingCompleted: false,
      lessonResume: null,

      completeOnboarding: () => {
        set({ onboardingCompleted: true })
        setCookie('tupi_app_seen', '1')
      },

      setConfidenceLevel: (value) => {
        set((state) => ({
          profile: {
            ...state.profile,
            confidenceLevel: value,
          },
        }))
      },

      setNotificationPreference: (requested, granted) => {
        set((state) => ({
          profile: {
            ...state.profile,
            notificationsRequested: requested,
            notificationsGranted: granted,
          },
        }))
      },

      setStreakGoal: (goal) => {
        set((state) => ({
          profile: {
            ...state.profile,
            streakGoalDays: goal,
          },
        }))
      },

      markInstallPromptSeen: () => {
        set((state) => ({
          profile: {
            ...state.profile,
            installedPromptSeen: true,
          },
        }))
      },

      saveLessonResume: (resume) => {
        set({ lessonResume: resume })
      },

      applyLessonResult: (result) => {
        set((state) => {
          const updatedProgress = updateStreak({
            ...state.progress,
            totalXp: state.progress.totalXp + result.xpEarned,
            completedLessons: {
              ...state.progress.completedLessons,
              [result.lessonId]: {
                completedAt: nowIso(),
                accuracy: result.accuracy,
                xpEarned: result.xpEarned,
                durationSec: result.durationSec,
                bestCombo: result.bestCombo,
              },
            },
            unlockedLessons: Array.from(
              new Set([...state.progress.unlockedLessons, result.lessonId, 'unit1-lesson2']),
            ),
            currentMapPosition: {
              unitId: 'unit1',
              lessonId: 'unit1-lesson2',
            },
            pathNodes: state.progress.pathNodes.map((node, index) => {
              if (node.lessonId === result.lessonId) {
                return { ...node, completed: true }
              }
              if (index === 1) {
                return { ...node, unlocked: true }
              }
              return node
            }),
          })

          return {
            progress: updatedProgress,
            lessonResume: null,
          }
        })
      },

      awardGems: (amount) => {
        set((state) => ({
          progress: {
            ...state.progress,
            gems: state.progress.gems + amount,
          },
        }))
      },
    }),
    {
      name: 'tupi-trail-app',
      version: APP_STORE_VERSION,
      migrate: migrateAppStore,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        profile: state.profile,
        progress: state.progress,
        onboardingCompleted: state.onboardingCompleted,
        lessonResume: state.lessonResume,
      }),
    },
  ),
)
