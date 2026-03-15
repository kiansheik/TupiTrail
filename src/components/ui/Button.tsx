import type { ButtonHTMLAttributes } from 'react'

import { cn } from '@/lib/utils/classNames'

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'ghost'
  fullWidth?: boolean
}

export const Button = ({
  variant = 'primary',
  fullWidth = true,
  className,
  children,
  ...props
}: ButtonProps) => {
  const variantClass =
    variant === 'primary'
      ? 'bg-primary text-white border-2 border-primaryDark shadow-chunky active:translate-y-[2px] active:shadow-none'
      : variant === 'secondary'
        ? 'bg-white text-ink border-2 border-ink/20 shadow-chunky active:translate-y-[2px] active:shadow-none'
        : 'bg-transparent text-ink border-2 border-transparent'

  return (
    <button
      className={cn(
        'rounded-chunky px-4 py-3 text-base font-extrabold transition disabled:cursor-not-allowed disabled:opacity-40',
        fullWidth && 'w-full',
        variantClass,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
