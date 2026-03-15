import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
import { LessonSummaryCard } from '@/components/ui/LessonSummaryCard'
import { uiStrings } from '@/data/ui'
import { playSfx } from '@/lib/audio/sfx'
import { useAppStore } from '@/store/useAppStore'
import { useLessonSessionStore } from '@/store/useLessonSessionStore'

export const LessonCompleteScreen = () => {
  const navigate = useNavigate()
  const params = useParams<{ lessonId: string }>()
  const lessonId = params.lessonId ?? 'unit1-lesson1'

  const buildLessonResult = useLessonSessionStore((state) => state.buildLessonResult)
  const resetSession = useLessonSessionStore((state) => state.reset)
  const applyLessonResult = useAppStore((state) => state.applyLessonResult)
  const result = buildLessonResult()

  useEffect(() => {
    playSfx('finish')
  }, [])

  if (!result) {
    return (
      <ScreenScaffold
        title="Resumo indisponível"
        bottomSlot={<Button onClick={() => navigate(`/lesson/${lessonId}/intro`)}>Recomeçar</Button>}
      >
        <p className="text-sm font-bold text-ink/70">Finalize a lição para ver este resumo.</p>
      </ScreenScaffold>
    )
  }

  const claim = () => {
    applyLessonResult(result)
    resetSession()
    navigate('/streak/ignite')
  }

  return (
    <ScreenScaffold
      title="Vitória!"
      subtitle="Você concluiu a primeira lição"
      bottomSlot={<Button onClick={claim}>{uiStrings.claimXp}</Button>}
    >
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 160, damping: 15 }}
        className="space-y-4"
      >
        <div className="flex items-center gap-3 rounded-3xl border-2 border-accent bg-yellow-100 p-4">
          <CharacterAvatar id="bird" mood="happy" />
          <p className="text-sm font-black text-yellow-800">
            Hábito diário vence intensidade. Volte amanhã para manter sua ofensiva.
          </p>
        </div>
        <LessonSummaryCard result={result} />
      </motion.div>
    </ScreenScaffold>
  )
}
