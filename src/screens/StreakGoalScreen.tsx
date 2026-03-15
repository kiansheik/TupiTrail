import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { ChoiceCard } from '@/components/ui/ChoiceCard'
import { uiStrings } from '@/data/ui'
import { useAppStore } from '@/store/useAppStore'

export const StreakGoalScreen = () => {
  const navigate = useNavigate()
  const setStreakGoal = useAppStore((state) => state.setStreakGoal)
  const awardGems = useAppStore((state) => state.awardGems)
  const [selected, setSelected] = useState<3 | 5 | 7>(5)

  const options: Array<{ value: 3 | 5 | 7; label: string; gems: number }> = [
    { value: 3, label: uiStrings.goal3, gems: 10 },
    { value: 5, label: uiStrings.goal5, gems: 20 },
    { value: 7, label: uiStrings.goal7, gems: 30 },
  ]

  const commit = () => {
    const option = options.find((item) => item.value === selected)
    if (!option) {
      return
    }

    setStreakGoal(selected)
    awardGems(option.gems)
    navigate('/install')
  }

  return (
    <ScreenScaffold
      title={uiStrings.chooseGoal}
      subtitle="Compromisso leve, progresso constante"
      bottomSlot={<Button onClick={commit}>Confirmar meta</Button>}
    >
      <div className="space-y-3">
        {options.map((option) => (
          <ChoiceCard key={option.value} selected={selected === option.value} onClick={() => setSelected(option.value)}>
            <p className="font-black">{option.label}</p>
            <p className="text-sm font-semibold text-ink/60">Recompensa imediata: +{option.gems} gems</p>
          </ChoiceCard>
        ))}
      </div>
    </ScreenScaffold>
  )
}
