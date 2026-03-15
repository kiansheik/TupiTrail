import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import { AnalyticsTracker } from '@/lib/analytics/AnalyticsTracker'
import { lessonById } from '@/data/course'
import { ConfidenceScreen } from '@/screens/ConfidenceScreen'
import { InstallPromptScreen } from '@/screens/InstallPromptScreen'
import { IntroContinueScreen } from '@/screens/IntroContinueScreen'
import { LessonCompleteScreen } from '@/screens/LessonCompleteScreen'
import { LessonIntroScreen } from '@/screens/LessonIntroScreen'
import { LessonRunnerScreen } from '@/screens/LessonRunnerScreen'
import { MistakeReviewIntroScreen } from '@/screens/MistakeReviewIntroScreen'
import { NotificationPromptScreen } from '@/screens/NotificationPromptScreen'
import { PathMapScreen } from '@/screens/PathMapScreen'
import { StreakCelebrateScreen } from '@/screens/StreakCelebrateScreen'
import { StreakGoalScreen } from '@/screens/StreakGoalScreen'
import { ThreeMonthBenefitsScreen } from '@/screens/ThreeMonthBenefitsScreen'
import { WeeklyGoalPreviewScreen } from '@/screens/WeeklyGoalPreviewScreen'
import { WelcomeScreen } from '@/screens/WelcomeScreen'
import { useAppStore } from '@/store/useAppStore'

const HomeRoute = () => {
  const lessonResume = useAppStore((state) => state.lessonResume)
  const onboardingCompleted = useAppStore((state) => state.onboardingCompleted)

  if (lessonResume?.lessonId && lessonById.has(lessonResume.lessonId)) {
    if (lessonResume.needsMistakeIntro) {
      return <Navigate to={`/lesson/${lessonResume.lessonId}/mistakes`} replace />
    }

    if (lessonResume.queueState?.phase === 'complete') {
      return <Navigate to={`/lesson/${lessonResume.lessonId}/complete`} replace />
    }

    return <Navigate to={`/lesson/${lessonResume.lessonId}/run`} replace />
  }

  if (onboardingCompleted) {
    return <Navigate to="/map" replace />
  }

  return <WelcomeScreen />
}

export const AppRouter = () => {
  return (
    <HashRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AnalyticsTracker />
      <Routes>
        <Route path="/" element={<HomeRoute />} />

        <Route path="/onboarding/intro/:stepId" element={<IntroContinueScreen />} />
        <Route path="/onboarding/confidence" element={<ConfidenceScreen />} />
        <Route path="/onboarding/weekly-preview" element={<WeeklyGoalPreviewScreen />} />
        <Route path="/onboarding/notifications" element={<NotificationPromptScreen />} />
        <Route path="/onboarding/benefits" element={<ThreeMonthBenefitsScreen />} />

        <Route path="/lesson/:lessonId/intro" element={<LessonIntroScreen />} />
        <Route path="/lesson/:lessonId/run" element={<LessonRunnerScreen />} />
        <Route path="/lesson/:lessonId/mistakes" element={<MistakeReviewIntroScreen />} />
        <Route path="/lesson/:lessonId/complete" element={<LessonCompleteScreen />} />

        <Route path="/streak/ignite" element={<StreakCelebrateScreen />} />
        <Route path="/streak/goal" element={<StreakGoalScreen />} />
        <Route path="/install" element={<InstallPromptScreen />} />
        <Route path="/map" element={<PathMapScreen />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </HashRouter>
  )
}
