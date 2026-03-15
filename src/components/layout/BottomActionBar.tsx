import type { PropsWithChildren } from 'react'

export const BottomActionBar = ({ children }: PropsWithChildren) => {
  return (
    <div className="sticky bottom-0 mt-4 border-t-2 border-ink/10 bg-shell/95 px-4 py-3 backdrop-blur">
      {children}
    </div>
  )
}
