import { useMemo } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { NarratorScene } from '@/components/ui/NarratorScene'
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
      bottomSlot={<Button onClick={() => navigate(step.nextPath)}>Continuar</Button>}
    >
      <NarratorScene
        title={step.title}
        body={step.description}
        characterId="bird"
        mood={step.mascotMood ?? 'happy'}
        label="Guia inicial"
      />
    </ScreenScaffold>
  )
}
