import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { NarratorScene } from '@/components/ui/NarratorScene'
import { WeeklyImpactPanel } from '@/components/ui/WeeklyImpactPanel'
import { cn } from '@/lib/utils/classNames'

export const WeeklyGoalPreviewScreen = () => {
  const navigate = useNavigate()
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [dense, setDense] = useState(false)

  useEffect(() => {
    const element = containerRef.current
    if (!element) {
      return
    }

    let frame = 0
    const evaluateDensity = () => {
      cancelAnimationFrame(frame)
      frame = window.requestAnimationFrame(() => {
        const overflow = element.scrollHeight > element.clientHeight + 8
        const shortViewport = window.innerHeight <= 720
        const shouldBeDense = overflow || shortViewport
        setDense((current) => (current === shouldBeDense ? current : shouldBeDense))
      })
    }

    evaluateDensity()

    const resizeObserver = new ResizeObserver(() => evaluateDensity())
    resizeObserver.observe(element)
    window.addEventListener('resize', evaluateDensity)

    return () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      window.removeEventListener('resize', evaluateDensity)
    }
  }, [])

  return (
    <ScreenScaffold
      contentClassName="h-full overflow-y-auto pr-1"
      bottomSlot={<Button onClick={() => navigate('/onboarding/notifications')}>Continuar</Button>}
    >
      <div ref={containerRef} className={cn('flex h-full min-h-0 flex-col pb-1', dense ? 'gap-2' : 'gap-3')}>
        <NarratorScene
          title="50 palavras na primeira semana"
          body="Passos curtos, repetição inteligente e revisão guiada."
          characterId="bird"
          mood="encouraging"
          label="Plano rápido"
          compact
          dense={dense}
        />
        <WeeklyImpactPanel compact dense={dense} />
      </div>
    </ScreenScaffold>
  )
}
