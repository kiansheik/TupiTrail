import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
import { uiStrings } from '@/data/ui'

export const WelcomeScreen = () => {
  const navigate = useNavigate()

  const goNext = () => navigate('/onboarding/intro/mascot')

  return (
    <ScreenScaffold
      title="Aprenda Tupi com ritmo diário"
      subtitle="Prototype data-driven com flow gamificado"
      bottomSlot={
        <div className="space-y-2">
          <Button onClick={goNext}>{uiStrings.startNow}</Button>
          <Button variant="secondary" onClick={goNext}>
            {uiStrings.alreadyHaveAccount}
          </Button>
        </div>
      }
    >
      <div className="flex flex-col items-center gap-4 py-8">
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
        >
          <CharacterAvatar id="bird" mood="happy" className="h-36 w-36" />
        </motion.div>
        <p className="max-w-[280px] text-center text-base font-bold text-ink/70">
          UX inspirada em apps de idioma, com assets originais e lições guiadas por dados.
        </p>
      </div>
    </ScreenScaffold>
  )
}
