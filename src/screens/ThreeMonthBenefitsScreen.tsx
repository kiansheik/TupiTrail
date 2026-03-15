import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
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
      title="O que você conquista em 3 meses"
      subtitle="Estudo curto e consistente"
      bottomSlot={<Button onClick={onContinue}>Vamos para a primeira lição</Button>}
    >
      <div className="space-y-3">
        {threeMonthBenefits.map((benefit) => (
          <Card key={benefit}>
            <p className="text-base font-bold text-ink">{benefit}</p>
          </Card>
        ))}
      </div>
    </ScreenScaffold>
  )
}
