import { useEffect } from 'react'

import { MobileFrame } from '@/components/layout/MobileFrame'
import { AppRouter } from '@/app/router'

export const App = () => {
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      import('virtual:pwa-register').then(({ registerSW }) => {
        registerSW({ immediate: true })
      })
    }
  }, [])

  return (
    <MobileFrame>
      <AppRouter />
    </MobileFrame>
  )
}
