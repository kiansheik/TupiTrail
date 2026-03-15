import { motion } from 'framer-motion'

import { CharacterAvatar } from '@/components/ui/CharacterAvatar'

type TamaChatAvatarProps = {
  enterFrom?: 'left' | 'right'
}

export const TamaChatAvatar = ({ enterFrom = 'right' }: TamaChatAvatarProps) => {
  return (
    <motion.div
      initial={{ x: enterFrom === 'left' ? -120 : 120, y: 18, opacity: 0 }}
      animate={{ x: 0, y: 0, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 160, damping: 17 }}
      className="relative h-44 w-44"
    >
      <motion.div
        animate={{ y: [0, -4, 0] }}
        transition={{ duration: 2.1, repeat: Infinity, ease: 'easeInOut' }}
        className="relative h-full w-full"
      >
        <CharacterAvatar id="bird" mood="happy" blink className="h-44 w-44" />

        <motion.div
          aria-hidden
          className="absolute right-6 top-2 h-3 w-3 rounded-full bg-[#fff4d0]"
          animate={{ scale: [0.9, 1.4, 0.9], opacity: [0.4, 1, 0.4] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
        >
          <div className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#ffd166]" />
        </motion.div>
      </motion.div>
    </motion.div>
  )
}
