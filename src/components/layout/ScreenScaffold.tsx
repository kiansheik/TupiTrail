import type { PropsWithChildren, ReactNode } from 'react'

import { BottomActionBar } from '@/components/layout/BottomActionBar'
import { TopProgressBar } from '@/components/layout/TopProgressBar'
import { cn } from '@/lib/utils/classNames'

type ScreenScaffoldProps = PropsWithChildren<{
  title?: string
  subtitle?: string
  progress?: number
  combo?: number
  onExit?: () => void
  bottomSlot?: ReactNode
  contentClassName?: string
}>

export const ScreenScaffold = ({
  children,
  title,
  subtitle,
  progress,
  combo,
  onExit,
  bottomSlot,
  contentClassName,
}: ScreenScaffoldProps) => {
  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      {typeof progress === 'number' ? <TopProgressBar progress={progress} combo={combo} onExit={onExit} /> : null}
      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 pb-4 pt-3">
        {title ? (
          <h1 className="font-display text-xl leading-tight text-ink sm:text-2xl">{title}</h1>
        ) : null}
        {subtitle ? <p className="mt-1 text-sm font-semibold text-ink/70">{subtitle}</p> : null}
        <div className={cn('mt-3 flex min-h-0 flex-1 flex-col', contentClassName)}>{children}</div>
      </main>
      {bottomSlot ? <BottomActionBar>{bottomSlot}</BottomActionBar> : null}
    </div>
  )
}
