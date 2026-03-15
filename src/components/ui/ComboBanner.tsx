import { AnimatePresence, motion } from 'framer-motion'

import { comboMessage } from '@/core/lesson-engine/combo'

type ComboBannerProps = {
  combo: number
}

export const ComboBanner = ({ combo }: ComboBannerProps) => {
  const message = comboMessage(combo)

  return (
    <AnimatePresence>
      {combo >= 3 ? (
        <motion.div
          key="combo"
          initial={{ scale: 0.6, opacity: 0, y: -12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: -10 }}
          transition={{ type: 'spring', stiffness: 260, damping: 16 }}
          className="mb-3 inline-flex items-center gap-2 rounded-full border-2 border-yellow-400 bg-yellow-100 px-4 py-2"
        >
          <span className="text-sm font-black text-yellow-700">COMBO x{combo}</span>
          <span className="text-sm font-bold text-yellow-800">{message}</span>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}
