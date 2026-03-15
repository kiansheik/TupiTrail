import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
import { StreakCalendar } from '@/components/ui/StreakCalendar'
import { playSfx } from '@/lib/audio/sfx'
import { useAppStore } from '@/store/useAppStore'

export const StreakCelebrateScreen = () => {
  const navigate = useNavigate()
  const streak = useAppStore((state) => state.progress.streak)

  useEffect(() => {
    playSfx('streak')
  }, [])

  return (
    <ScreenScaffold
      title="Ofensiva acesa!"
      subtitle={`Sequência atual: ${streak.current} dia(s)`}
      bottomSlot={<Button onClick={() => navigate('/streak/goal')}>Definir meta</Button>}
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 rounded-3xl border-2 border-primary/40 bg-primary/10 p-4">
          <CharacterAvatar id="bird" mood="happy" />
          <p className="text-sm font-black text-ink/80">Ótimo início. Consistência diária destrava progresso rápido.</p>
        </div>
        <StreakCalendar week={streak.week} />
      </div>
    </ScreenScaffold>
  )
}
