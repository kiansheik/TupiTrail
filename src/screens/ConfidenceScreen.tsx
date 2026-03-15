import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { ChoiceCard } from '@/components/ui/ChoiceCard'
import { confidenceOptions } from '@/data/onboarding'
import { useAppStore } from '@/store/useAppStore'

export const ConfidenceScreen = () => {
  const navigate = useNavigate()
  const setConfidenceLevel = useAppStore((state) => state.setConfidenceLevel)
  const [value, setValue] = useState<'level1' | 'level2' | 'level3'>('level1')

  const onContinue = () => {
    setConfidenceLevel(value)
    navigate('/onboarding/weekly-preview')
  }

  return (
    <ScreenScaffold
      title="Quanto você entende de Tupi?"
      subtitle="Recomendamos iniciar no nível 1"
      bottomSlot={<Button onClick={onContinue}>Continuar</Button>}
    >
      <div className="space-y-3">
        {confidenceOptions.map((option) => (
          <ChoiceCard
            key={option.id}
            selected={value === option.id}
            onClick={() => setValue(option.id as 'level1' | 'level2' | 'level3')}
          >
            <p className="font-black">{option.label}</p>
            <p className="text-sm font-semibold text-ink/60">{option.description}</p>
          </ChoiceCard>
        ))}
      </div>
    </ScreenScaffold>
  )
}
