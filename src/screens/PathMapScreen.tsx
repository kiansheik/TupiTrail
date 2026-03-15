import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PathMap } from '@/components/ui/PathMap'
import type { LessonMapNode } from '@/core/lesson-engine/types'
import { useAppStore } from '@/store/useAppStore'

export const PathMapScreen = () => {
  const navigate = useNavigate()
  const progress = useAppStore((state) => state.progress)

  const onNodeClick = (node: LessonMapNode) => {
    if (!node.unlocked || node.type !== 'lesson') {
      return
    }

    if (node.lessonId === 'unit1-lesson1') {
      navigate('/lesson/unit1-lesson1/intro')
    }
  }

  return (
    <ScreenScaffold
      title="Mapa da trilha"
      subtitle="Conteúdo e desbloqueios 100% orientados por dados"
      bottomSlot={<Button onClick={() => navigate('/lesson/unit1-lesson1/intro')}>Repetir lição 1</Button>}
    >
      <div className="space-y-4">
        <Card className="flex items-center justify-between">
          <div>
            <p className="text-xs font-black uppercase text-ink/50">Total XP</p>
            <p className="font-display text-3xl text-ink">{progress.totalXp}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-ink/50">Gems</p>
            <p className="font-display text-3xl text-ink">{progress.gems}</p>
          </div>
          <div>
            <p className="text-xs font-black uppercase text-ink/50">Streak</p>
            <p className="font-display text-3xl text-ink">{progress.streak.current}</p>
          </div>
        </Card>
        <PathMap nodes={progress.pathNodes} onNodeClick={onNodeClick} />
      </div>
    </ScreenScaffold>
  )
}
