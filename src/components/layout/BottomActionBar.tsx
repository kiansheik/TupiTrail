import type { PropsWithChildren } from 'react'

export const BottomActionBar = ({ children }: PropsWithChildren) => {
  return (
    <div className="mt-auto border-t-2 border-ink/10 bg-shell/95 px-4 py-2.5 backdrop-blur">
      {children}
    </div>
  )
}
