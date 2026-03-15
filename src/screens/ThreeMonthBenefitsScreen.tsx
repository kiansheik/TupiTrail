import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { NarratorScene } from '@/components/ui/NarratorScene'
import type { ThreeMonthBenefit } from '@/data/onboarding'
import { threeMonthBenefits } from '@/data/onboarding'
import { useAppStore } from '@/store/useAppStore'

const ConfidenceIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden>
    <rect x="8" y="10" width="48" height="44" rx="14" fill="#e7f8ef" />
    <path d="M32 20l14 7v9c0 8-6 14-14 18-8-4-14-10-14-18v-9l14-7z" fill="#2eb489" />
    <path d="M25 36l5 5 9-10" stroke="#fff" strokeWidth="3.5" fill="none" strokeLinecap="round" />
  </svg>
)

const VocabularyIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden>
    <rect x="8" y="10" width="48" height="44" rx="14" fill="#fff5e2" />
    <rect x="18" y="18" width="12" height="28" rx="4" fill="#ffbe0b" />
    <rect x="34" y="18" width="12" height="28" rx="4" fill="#ffd166" />
    <path d="M20 26h8M20 32h8M36 30h8M36 36h8" stroke="#8c5b00" strokeWidth="2.6" strokeLinecap="round" />
  </svg>
)

const HabitIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden>
    <rect x="8" y="10" width="48" height="44" rx="14" fill="#e8f3ff" />
    <circle cx="32" cy="32" r="14" fill="#4c78ff" />
    <path d="M32 24v9l6 4" stroke="#fff" strokeWidth="3.4" strokeLinecap="round" fill="none" />
    <circle cx="32" cy="32" r="2.5" fill="#fff" />
  </svg>
)

const toneClasses: Record<ThreeMonthBenefit['tone'], string> = {
  mint: 'border-emerald-200 bg-[linear-gradient(120deg,#f2fff7_0%,#e6f9ef_100%)]',
  amber: 'border-amber-200 bg-[linear-gradient(120deg,#fffaf0_0%,#fff0cf_100%)]',
  sky: 'border-sky-200 bg-[linear-gradient(120deg,#f3f9ff_0%,#e4f0ff_100%)]',
}

const iconById: Record<ThreeMonthBenefit['id'], ReactNode> = {
  confidence: <ConfidenceIcon />,
  vocabulary: <VocabularyIcon />,
  habit: <HabitIcon />,
}

export const ThreeMonthBenefitsScreen = () => {
  const navigate = useNavigate()
  const completeOnboarding = useAppStore((state) => state.completeOnboarding)

  const onContinue = () => {
    completeOnboarding()
    navigate('/lesson/unit1-lesson1/intro')
  }

  return (
    <ScreenScaffold
      contentClassName="h-full"
      bottomSlot={<Button onClick={onContinue}>Vamos para a primeira lição</Button>}
    >
      <div className="flex h-full min-h-0 flex-col gap-3">
        <NarratorScene
          title="O que você conquista em 3 meses"
          body="Com sessões curtas e frequentes, o salto de confiança vem rápido."
          characterId="bird"
          mood="encouraging"
          label="Meta de 3 meses"
        />
        <div className="grid min-h-0 flex-1 grid-rows-3 gap-2">
          {threeMonthBenefits.map((benefit) => (
            <article
              key={benefit.id}
              className={`flex min-h-0 items-center gap-3 rounded-2xl border-2 px-3 py-2 ${toneClasses[benefit.tone]}`}
            >
              <div className="shrink-0">{iconById[benefit.id]}</div>
              <div className="min-w-0">
                <h3 className="text-[15px] font-black leading-tight text-ink">{benefit.title}</h3>
                <p className="mt-1 text-xs font-bold leading-snug text-ink/70">{benefit.description}</p>
              </div>
            </article>
          ))}
        </div>
      </div>
    </ScreenScaffold>
  )
}
