import { motion } from 'framer-motion'

import { CharacterAvatar } from '@/components/ui/CharacterAvatar'

const WaveIcon = () => (
  <svg viewBox="0 0 48 48" className="h-8 w-8" aria-hidden>
    <circle cx="24" cy="24" r="22" fill="#fff5d7" stroke="#1b2b2630" strokeWidth="2" />
    <path
      d="M16 28c0-3 2-4 3-4 1 0 2 1 2 2v-8c0-1 1-2 2-2s2 1 2 2v7c0-1 1-2 2-2s2 1 2 2v2c0-1 1-2 2-2s2 1 2 2v4c0 6-4 10-10 10s-9-4-9-9v-4z"
      fill="#2eb489"
    />
  </svg>
)

export const TamaChatAvatar = () => {
  return (
    <motion.div
      initial={{ x: 120, y: 18, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 17 }}
      className="relative h-44 w-44"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
        className="relative h-full w-full"
      >
        <CharacterAvatar id="bird" mood="happy" className="h-44 w-44" />

        <motion.div
          aria-hidden
          className="absolute left-[56px] top-[72px] h-[8px] w-[16px] rounded-full bg-[#2eb489]"
          animate={{ opacity: [0, 0, 1, 1, 0, 0], scaleY: [0.4, 0.4, 1, 1, 0.4, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, times: [0, 0.38, 0.42, 0.46, 0.5, 1] }}
        />
        <motion.div
          aria-hidden
          className="absolute left-[102px] top-[72px] h-[8px] w-[16px] rounded-full bg-[#2eb489]"
          animate={{ opacity: [0, 0, 1, 1, 0, 0], scaleY: [0.4, 0.4, 1, 1, 0.4, 0.4] }}
          transition={{ duration: 2.8, repeat: Infinity, times: [0, 0.38, 0.42, 0.46, 0.5, 1] }}
        />

        <motion.div
          className="absolute -left-5 top-5"
          animate={{ rotate: [0, 18, -8, 18, 0], y: [0, -2, 1, -2, 0] }}
          transition={{ duration: 1.7, repeat: Infinity, repeatDelay: 1.2 }}
        >
          <WaveIcon />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
