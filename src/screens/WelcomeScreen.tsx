import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { NarratorScene } from '@/components/ui/NarratorScene'
import { uiStrings } from '@/data/ui'

export const WelcomeScreen = () => {
  const navigate = useNavigate()

  const goNext = () => navigate('/onboarding/intro/mascot')

  return (
    <ScreenScaffold
      bottomSlot={
        <div className="space-y-2">
          <Button onClick={goNext}>{uiStrings.startNow}</Button>
          <Button variant="secondary" onClick={goNext}>
            {uiStrings.alreadyHaveAccount}
          </Button>
        </div>
      }
    >
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
        <NarratorScene
          title="Bem-vindo ao Tupi Trail"
          body="Eu sou a Tama. Vou te guiar nas primeiras lições para criar ritmo e constância."
          mood="happy"
          label="Apresentação"
        />
      </motion.div>
    </ScreenScaffold>
  )
}
