import type { PropsWithChildren, ReactNode } from 'react'

import { BottomActionBar } from '@/components/layout/BottomActionBar'
import { TopProgressBar } from '@/components/layout/TopProgressBar'

type ScreenScaffoldProps = PropsWithChildren<{
  title?: string
  subtitle?: string
  progress?: number
  combo?: number
  bottomSlot?: ReactNode
}>

export const ScreenScaffold = ({
  children,
  title,
  subtitle,
  progress,
  combo,
  bottomSlot,
}: ScreenScaffoldProps) => {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      {typeof progress === 'number' ? <TopProgressBar progress={progress} combo={combo} /> : null}
      <main className="flex-1 px-4 pb-4 pt-5">
        {title ? <h1 className="font-display text-3xl leading-tight text-ink">{title}</h1> : null}
        {subtitle ? <p className="mt-2 text-base font-semibold text-ink/70">{subtitle}</p> : null}
        <div className="mt-6">{children}</div>
      </main>
      {bottomSlot ? <BottomActionBar>{bottomSlot}</BottomActionBar> : null}
    </div>
  )
}
