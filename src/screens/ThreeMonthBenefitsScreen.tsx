import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { NarratorScene } from '@/components/ui/NarratorScene'
import { threeMonthBenefits } from '@/data/onboarding'
import { useAppStore } from '@/store/useAppStore'

export const ThreeMonthBenefitsScreen = () => {
  const navigate = useNavigate()
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)

  const onContinue = () => {
    completeOnboarding()
    navigate('/lesson/unit1-lesson1/intro')
  }

  return (
    <ScreenScaffold
      bottomSlot={<Button onClick={onContinue}>Vamos para a primeira lição</Button>}
    >
      <div className="space-y-3">
        <NarratorScene
          title="O que você conquista em 3 meses"
          body="Com sessões curtas e frequentes, o salto de confiança vem rápido."
          characterId="bird"
          mood="encouraging"
          label="Meta de 3 meses"
        />
        {threeMonthBenefits.map((benefit) => (
          <Card key={benefit}>
            <p className="text-base font-bold text-ink">{benefit}</p>
          </Card>
        ))}
      </div>
    </ScreenScaffold>
  )
}
