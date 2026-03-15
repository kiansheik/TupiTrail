import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { NarratorScene } from '@/components/ui/NarratorScene'

export const WeeklyGoalPreviewScreen = () => {
  const navigate = useNavigate()

  return (
    <ScreenScaffold
      bottomSlot={<Button onClick={() => navigate('/onboarding/notifications')}>Continuar</Button>}
    >
      <div className="space-y-4">
        <NarratorScene
          title="50 palavras na primeira semana"
          body="Passos curtos e revisão inteligente para acelerar sem sobrecarga."
          characterId="bird"
          mood="encouraging"
          label="Plano rápido"
        />
        <Card>
          <div className="space-y-3">
            <div className="h-4 w-full rounded-full bg-shell">
              <div className="h-4 w-2/3 rounded-full bg-primary" />
            </div>
            <p className="text-sm font-bold text-ink/70">
              Em 7 dias você desbloqueia vocabulário essencial: bebidas, cortesia e escolhas simples.
            </p>
          </div>
        </Card>
      </div>
    </ScreenScaffold>
  )
}
