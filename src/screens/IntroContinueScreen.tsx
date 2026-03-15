import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
import { introSteps } from '@/data/onboarding'

export const IntroContinueScreen = () => {
  const navigate = useNavigate()
  const params = useParams<{ stepId: string }>()

  const step = useMemo(
    () => introSteps.find((item) => item.id === params.stepId) ?? introSteps[0],
    [params.stepId],
  )

  return (
    <ScreenScaffold
      title={step.title}
      subtitle={step.description}
      bottomSlot={<Button onClick={() => navigate(step.nextPath)}>Continuar</Button>}
    >
      <Card className="flex items-center justify-center py-8">
        <CharacterAvatar id="bird" mood={step.mascotMood ?? 'happy'} className="h-32 w-32" />
      </Card>
    </ScreenScaffold>
  )
}
