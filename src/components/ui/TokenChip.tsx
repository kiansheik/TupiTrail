import { motion } from 'framer-motion'

import { cn } from '@/lib/utils/classNames'

type TokenChipProps = {
  token: string
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  layoutId?: string
}

export const TokenChip = ({ token, selected, onClick, disabled, layoutId }: TokenChipProps) => {
  return (
    <motion.button
      type="button"
      layout
      layoutId={layoutId}
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.96 }}
      transition={{ type: 'spring', stiffness: 260, damping: 28, mass: 0.75 }}
      className={cn(
        'rounded-2xl border-2 px-3 py-2 text-sm font-extrabold',
        selected ? 'border-primaryDark bg-primary/20 text-ink' : 'border-ink/20 bg-white text-ink',
        disabled && 'opacity-40',
      )}
    >
      {token}
    </motion.button>
  )
}
