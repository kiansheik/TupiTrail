import { useMemo } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { PathMap } from '@/components/ui/PathMap'
import type { LessonMapNode } from '@/core/lesson-engine/types'
import { useAppStore } from '@/store/useAppStore'

export const PathMapScreen = () => {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const progress = useAppStore((state) => state.progress)

  const simLevel = parseInt(searchParams.get('sim') ?? '', 10)

  const nodes = useMemo<LessonMapNode[]>(() => {
    if (!Number.isFinite(simLevel) || simLevel <= 0) return progress.pathNodes
    return progress.pathNodes.map((node, index) => ({
      ...node,
      completed: index < simLevel,
      unlocked: index <= simLevel,
    }))
  }, [progress.pathNodes, simLevel])

  const onNodeClick = (node: LessonMapNode) => {
    if (!node.unlocked || node.type !== 'lesson') return
    navigate(`/lesson/${node.lessonId}/intro`)
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
        <PathMap nodes={nodes} onNodeClick={onNodeClick} />
      </div>
    </ScreenScaffold>
  )
}
