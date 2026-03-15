import type { PropsWithChildren, ReactNode } from 'react'

import { BottomActionBar } from '@/components/layout/BottomActionBar'
import { TopProgressBar } from '@/components/layout/TopProgressBar'
import { cn } from '@/lib/utils/classNames'

type ScreenScaffoldProps = PropsWithChildren<{
  title?: string
  subtitle?: string
  progress?: number
  combo?: number
  bottomSlot?: ReactNode
  contentClassName?: string
}>

export const ScreenScaffold = ({
  children,
  title,
  subtitle,
  progress,
  combo,
  bottomSlot,
  contentClassName,
}: ScreenScaffoldProps) => {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {typeof progress === 'number' ? <TopProgressBar progress={progress} combo={combo} /> : null}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-5">
        {title ? (
          <h1 className="font-display text-2xl leading-tight text-ink sm:text-3xl">{title}</h1>
        ) : null}
        {subtitle ? <p className="mt-2 text-base font-semibold text-ink/70">{subtitle}</p> : null}
        <div className={cn('mt-4 flex min-h-0 flex-1 flex-col', contentClassName)}>{children}</div>
      </main>
      {bottomSlot ? <BottomActionBar>{bottomSlot}</BottomActionBar> : null}
    </div>
  )
}
