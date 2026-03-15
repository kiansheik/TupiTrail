import { motion } from 'framer-motion'

import { cn } from '@/lib/utils/classNames'

type TopProgressBarProps = {
  progress: number
  combo?: number
}

export const TopProgressBar = ({ progress, combo = 0 }: TopProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, progress))
  const comboActive = combo >= 3

  return (
    <div className="w-full px-4 pt-4">
      <div className="h-3 w-full rounded-full border-2 border-ink/30 bg-white/70">
        <motion.div
          className={cn(
            'h-full rounded-full',
            comboActive
              ? 'bg-[linear-gradient(90deg,#ffd166,#ff9f1c)]'
              : 'bg-[linear-gradient(90deg,#2eb489,#4fd1a5)]',
          )}
          animate={{ width: `${clamped}%` }}
          transition={{ type: 'spring', stiffness: 120, damping: 22 }}
        />
      </div>
    </div>
  )
}
