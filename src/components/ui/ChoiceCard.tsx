import type { PropsWithChildren } from 'react'

import { cn } from '@/lib/utils/classNames'

type ChoiceCardProps = PropsWithChildren<{
  selected?: boolean
  onClick?: () => void
  disabled?: boolean
  className?: string
}>

export const ChoiceCard = ({ children, selected, onClick, disabled, className }: ChoiceCardProps) => {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={cn(
        'w-full rounded-2xl border-2 px-3 py-3 text-left text-base font-bold transition',
        selected
          ? 'border-primaryDark bg-primary/20 text-ink'
          : 'border-ink/15 bg-white hover:border-primary/60 hover:bg-primary/5',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
    >
      {children}
    </button>
  )
}
