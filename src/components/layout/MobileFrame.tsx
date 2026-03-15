import type { PropsWithChildren } from 'react'

export const MobileFrame = ({ children }: PropsWithChildren) => {
  return (
    <div className="h-[100dvh] w-full overflow-hidden bg-[radial-gradient(circle_at_top,_#fffbe9,_#f5ecd1_45%,_#e9f4ec)] p-2 sm:p-4">
      <div className="mx-auto flex h-full w-full max-w-[430px] flex-col overflow-hidden rounded-[2rem] border-4 border-ink/20 bg-shell shadow-2xl">
        {children}
      </div>
    </div>
  )
}
