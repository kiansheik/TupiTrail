import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export const WeeklyGoalPreviewScreen = () => {
  const navigate = useNavigate()

  return (
    <ScreenScaffold
      title="Você vai aprender 50 palavras na primeira semana"
      subtitle="Passos curtos, repetição inteligente e revisão guiada"
      bottomSlot={<Button onClick={() => navigate('/onboarding/notifications')}>Continuar</Button>}
    >
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
    </ScreenScaffold>
  )
}
