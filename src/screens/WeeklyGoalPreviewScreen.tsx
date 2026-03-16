import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { NarratorScene } from '@/components/ui/NarratorScene'
import { WeeklyImpactPanel } from '@/components/ui/WeeklyImpactPanel'

export const WeeklyGoalPreviewScreen = () => {
  const navigate = useNavigate()

  return (
    <ScreenScaffold
      contentClassName="h-full"
      bottomSlot={<Button onClick={() => navigate('/onboarding/notifications')}>Continuar</Button>}
    >
      <div className="flex h-full min-h-0 flex-col gap-3 pb-1">
        <NarratorScene
          title="50 palavras na primeira semana"
          body="Passos curtos, repetição inteligente e revisão guiada."
          characterId="bird"
          mood="encouraging"
          label="Plano rápido"
          compact
        />
        <WeeklyImpactPanel />
      </div>
    </ScreenScaffold>
  )
}
