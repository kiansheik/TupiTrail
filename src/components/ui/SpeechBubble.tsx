import type { PropsWithChildren } from 'react'

import { cn } from '@/lib/utils/classNames'

type SpeechBubbleProps = PropsWithChildren<{
  tail?: 'left' | 'right'
  className?: string
  tailClassName?: string
}>

export const SpeechBubble = ({ children, tail = 'left', className, tailClassName }: SpeechBubbleProps) => {
  const isRight = tail === 'right'

  return (
    <div
      className={cn(
        'relative rounded-3xl border-2 border-ink/20 bg-white p-4 text-base font-bold text-ink',
        className,
      )}
    >
      {children}
      <div
        className={cn(
          'absolute -bottom-2 h-4 w-4 border-ink/20 bg-white',
          isRight ? 'right-6 -rotate-45 border-b-2 border-l-2' : 'left-6 rotate-45 border-b-2 border-r-2',
          tailClassName,
        )}
      />
    </div>
  )
}
