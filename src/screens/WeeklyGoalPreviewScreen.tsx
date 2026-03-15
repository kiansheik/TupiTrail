import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { NarratorScene } from '@/components/ui/NarratorScene'
import { WeeklyImpactPanel } from '@/components/ui/WeeklyImpactPanel'

export const WeeklyGoalPreviewScreen = () => {
  const navigate = useNavigate()

  return (
    <ScreenScaffold
      bottomSlot={<Button onClick={() => navigate('/onboarding/notifications')}>Continuar</Button>}
    >
      <div className="space-y-4">
        <NarratorScene
          title="50 palavras na primeira semana"
          body="Passos curtos, repetição inteligente e revisão guiada."
          characterId="bird"
          mood="encouraging"
          label="Plano rápido"
        />
        <WeeklyImpactPanel />
      </div>
    </ScreenScaffold>
  )
}
