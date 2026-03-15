import type { PropsWithChildren } from 'react'

export const MobileFrame = ({ children }: PropsWithChildren) => {
  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_#fffbe9,_#f5ecd1_45%,_#e9f4ec)] px-3 py-4 sm:px-6">
      <div className="mx-auto flex min-h-[96vh] w-full max-w-[430px] flex-col overflow-hidden rounded-[2rem] border-4 border-ink/20 bg-shell shadow-2xl">
        {children}
      </div>
    </div>
  )
}
