import type { PropsWithChildren } from 'react'

import { cn } from '@/lib/utils/classNames'

type CardProps = PropsWithChildren<{
  className?: string
}>

export const Card = ({ children, className }: CardProps) => {
  return <section className={cn('rounded-3xl border-2 border-ink/15 bg-white/85 p-4', className)}>{children}</section>
}
