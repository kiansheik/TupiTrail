import { motion } from 'framer-motion'

import { cn } from '@/lib/utils/classNames'

type TopProgressBarProps = {
  progress: number
  combo?: number
  onExit?: () => void
}

export const TopProgressBar = ({ progress, combo = 0, onExit }: TopProgressBarProps) => {
  const clamped = Math.max(0, Math.min(100, progress))
  const comboActive = combo >= 3

  return (
    <div className="flex items-center gap-3 px-4 pt-2">
      {onExit && (
        <button
          type="button"
          onClick={onExit}
          aria-label="Sair para o mapa"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border-2 border-ink/20 bg-white/70 text-sm font-black text-ink/50 transition hover:border-ink/40 hover:bg-white hover:text-ink/80"
        >
          ✕
        </button>
      )}
      <div className="h-3 flex-1 rounded-full border-2 border-ink/30 bg-white/70">
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
