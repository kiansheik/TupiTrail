import type { PropsWithChildren } from 'react'

export const SpeechBubble = ({ children }: PropsWithChildren) => {
  return (
    <div className="relative rounded-3xl border-2 border-ink/20 bg-white p-4 text-base font-bold text-ink">
      {children}
      <div className="absolute -bottom-2 left-6 h-4 w-4 rotate-45 border-b-2 border-r-2 border-ink/20 bg-white" />
    </div>
  )
}
