import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
import { StreakCalendar } from '@/components/ui/StreakCalendar'
import { playSfx } from '@/lib/audio/sfx'
import { useAppStore } from '@/store/useAppStore'

// ---- Animated Flame ----
const AnimatedFlame = () => (
  <div className="relative flex items-center justify-center">
    {/* Radial glow pulse backdrop */}
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 160,
        height: 160,
        background: 'radial-gradient(circle, rgba(251,133,0,0.28) 0%, rgba(239,71,111,0.14) 55%, transparent 80%)',
      }}
      animate={{ scale: [1, 1.18, 1], opacity: [0.7, 1, 0.7] }}
      transition={{ duration: 2.0, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Secondary outer glow */}
    <motion.div
      className="absolute rounded-full"
      style={{
        width: 200,
        height: 200,
        background: 'radial-gradient(circle, rgba(255,209,102,0.12) 0%, transparent 70%)',
      }}
      animate={{ scale: [1, 1.1, 0.95, 1.1, 1], opacity: [0.5, 0.8, 0.5, 0.8, 0.5] }}
      transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
    />

    {/* Flame SVG */}
    <motion.svg
      viewBox="0 0 80 100"
      className="relative h-36 w-28"
      style={{
        filter:
          'drop-shadow(0 0 14px rgba(239,71,111,0.70)) drop-shadow(0 0 28px rgba(251,133,0,0.45)) drop-shadow(0 0 6px rgba(255,209,102,0.50))',
      }}
      initial={{ scale: 0.3, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 160, damping: 13, delay: 0.05 }}
      aria-label="Ofensiva"
    >
      {/* Outer flame: deep red/orange */}
      <motion.path
        d="M40 98 C16 88 4 68 8 46 C12 26 26 14 32 2 C34 14 28 26 36 36 C38 20 48 8 56 0 C68 18 76 40 70 60 C66 76 54 90 40 98Z"
        fill="#ef476f"
        animate={{
          scaleY: [1, 1.04, 0.97, 1.04, 1],
          scaleX: [1, 0.97, 1.03, 0.97, 1],
        }}
        style={{ transformOrigin: '40px 98px', transformBox: 'fill-box' }}
        transition={{ duration: 1.7, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Middle flame: orange */}
      <motion.path
        d="M40 90 C22 80 14 62 18 46 C22 32 32 24 36 14 C38 24 34 34 40 42 C44 30 50 20 54 12 C64 28 68 46 62 60 C58 72 50 84 40 90Z"
        fill="#fb8500"
        animate={{
          scaleY: [1, 1.06, 0.95, 1.06, 1],
          scaleX: [1, 0.96, 1.04, 0.96, 1],
        }}
        style={{ transformOrigin: '40px 90px', transformBox: 'fill-box' }}
        transition={{ duration: 1.45, repeat: Infinity, ease: 'easeInOut', delay: 0.18 }}
      />

      {/* Inner flame: yellow */}
      <motion.path
        d="M40 82 C28 74 22 58 26 44 C30 32 36 26 38 18 C40 28 38 36 42 46 C46 36 50 26 52 18 C60 32 62 48 58 60 C54 70 48 78 40 82Z"
        fill="#ffd166"
        animate={{
          scaleY: [1, 1.07, 0.94, 1.07, 1],
        }}
        style={{ transformOrigin: '40px 82px', transformBox: 'fill-box' }}
        transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut', delay: 0.32 }}
      />

      {/* White-hot core */}
      <motion.ellipse
        cx="40"
        cy="65"
        rx="8"
        ry="15"
        fill="rgba(255,250,210,0.88)"
        animate={{
          ry: [15, 17, 12, 17, 15],
          opacity: [0.88, 1, 0.65, 1, 0.88],
        }}
        transition={{ duration: 1.25, repeat: Infinity, ease: 'easeInOut', delay: 0.38 }}
      />
    </motion.svg>
  </div>
)

// ---- Screen ----
export const StreakCelebrateScreen = () => {
  const navigate = useNavigate()
  const streak = useAppStore((state) => state.progress.streak)

  useEffect(() => {
    playSfx('streak')
  }, [])

  return (
    <ScreenScaffold bottomSlot={<Button onClick={() => navigate('/streak/goal')}>Definir meta</Button>}>
      <div className="flex flex-col gap-4">
        {/* ---- Flame hero ---- */}
        <div className="flex flex-col items-center gap-1 pt-1">
          <AnimatedFlame />

          <motion.h1
            className="font-display text-3xl leading-tight text-ink"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.38, duration: 0.26 }}
          >
            Ofensiva acesa!
          </motion.h1>

          <motion.p
            className="text-base font-semibold text-ink/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.52 }}
          >
            Sequência atual:{' '}
            <span className="font-black text-ink">
              {streak.current} dia{streak.current === 1 ? '' : 's'}
            </span>
          </motion.p>
        </div>

        {/* ---- Motivational card ---- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.44, type: 'spring', stiffness: 190, damping: 18 }}
          className="flex items-center gap-3 rounded-3xl border-2 border-primary/40 bg-primary/10 p-4"
        >
          <CharacterAvatar id="bird" mood="happy" />
          <p className="text-sm font-black text-ink/80">Ótimo início. Consistência diária destrava progresso rápido.</p>
        </motion.div>

        {/* ---- Streak calendar ---- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.55, type: 'spring', stiffness: 180, damping: 18 }}
        >
          <StreakCalendar week={streak.week} />
        </motion.div>
      </div>
    </ScreenScaffold>
  )
}
