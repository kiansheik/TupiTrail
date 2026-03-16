import { motion } from 'framer-motion'
import type { ReactNode } from 'react'

import { cn } from '@/lib/utils/classNames'

type Pillar = {
  id: string
  title: string
  description: string
  icon: ReactNode
}

const SprintIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden>
    <rect x="6" y="10" width="52" height="44" rx="12" fill="#e5f6ef" />
    <path d="M23 40l8-16h10l-6 12h9L33 52h-9l5-12h-6z" fill="#2eb489" />
    <path d="M10 22h10M8 30h8M12 38h10" stroke="#87d9bb" strokeWidth="3" strokeLinecap="round" />
  </svg>
)

const RepeatIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden>
    <rect x="6" y="10" width="52" height="44" rx="12" fill="#e8f1ff" />
    <path
      d="M20 26c2-6 8-10 15-10 5 0 9 2 12 5M44 16v8h-8"
      stroke="#4c78ff"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M44 38c-2 6-8 10-15 10-5 0-9-2-12-5M20 48v-8h8"
      stroke="#4c78ff"
      strokeWidth="4"
      fill="none"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
)

const ReviewIcon = () => (
  <svg viewBox="0 0 64 64" className="h-12 w-12" aria-hidden>
    <rect x="6" y="10" width="52" height="44" rx="12" fill="#fff4dd" />
    <rect x="18" y="18" width="20" height="28" rx="5" fill="#fff" stroke="#ffb703" strokeWidth="3" />
    <path d="M24 27h8M24 34h8" stroke="#ffb703" strokeWidth="3" strokeLinecap="round" />
    <path d="M41 39l4 4 9-9" stroke="#2eb489" strokeWidth="4" fill="none" strokeLinecap="round" />
    <circle cx="44" cy="28" r="6" fill="#ffe4a8" />
  </svg>
)

const weekPoints = [
  { x: 46, y: 118, label: 'Dom' },
  { x: 82, y: 95, label: 'Seg' },
  { x: 120, y: 81, label: 'Ter' },
  { x: 160, y: 76, label: 'Qua' },
  { x: 200, y: 81, label: 'Qui' },
  { x: 238, y: 95, label: 'Sex' },
  { x: 274, y: 118, label: 'Sab' },
]

const WeekArcIllustration = () => (
  <svg
    viewBox="0 0 320 170"
    className="w-full"
    style={{ aspectRatio: '320 / 170' }}
    aria-hidden
  >
    <defs>
      <linearGradient id="weekArc" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#94e1c3" />
        <stop offset="100%" stopColor="#2eb489" />
      </linearGradient>
    </defs>

    <rect x="4" y="4" width="312" height="162" rx="30" fill="#fffdf6" stroke="#1b2b2635" strokeWidth="3" />
    <path d="M35 130C70 62 250 62 285 130" stroke="url(#weekArc)" strokeWidth="10" fill="none" strokeLinecap="round" />

    {weekPoints.map((point) => (
      <g key={`${point.x}-${point.y}`}>
        <circle cx={point.x} cy={point.y} r="10" fill="#ffffff" stroke="#2eb489" strokeWidth="3" />
        <text
          x={point.x}
          y={point.y + 24}
          textAnchor="middle"
          fontSize="11"
          fontWeight="800"
          fill="#1b2b26"
        >
          {point.label}
        </text>
      </g>
    ))}

    <g>
      <circle cx="160" cy="104" r="20" fill="#2eb489" />
      <path d="M148 105l7 7 17-17" stroke="#ffffff" strokeWidth="5" strokeLinecap="round" fill="none" />
    </g>

    <text x="160" y="34" textAnchor="middle" fontSize="18" fontWeight="900" fill="#1b2b26">
      50 palavras em 7 dias
    </text>
  </svg>
)

const pillars: Pillar[] = [
  {
    id: 'short-steps',
    title: 'Passos curtos',
    description: 'Sessões de 5 a 10 minutos para manter ritmo diário.',
    icon: <SprintIcon />,
  },
  {
    id: 'smart-repeat',
    title: 'Repetição inteligente',
    description: 'As palavras retornam no momento certo para fixar.',
    icon: <RepeatIcon />,
  },
  {
    id: 'guided-review',
    title: 'Revisão guiada',
    description: 'Erros reaparecem até virarem acertos estáveis.',
    icon: <ReviewIcon />,
  },
]

type WeeklyImpactPanelProps = {
  className?: string
}

export const WeeklyImpactPanel = ({ className }: WeeklyImpactPanelProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className={cn(
        'flex min-h-0 flex-1 flex-col rounded-[1.3rem] border-2 border-ink/20 bg-[linear-gradient(180deg,#f0fbf7_0%,#fff7e7_100%)] p-3',
        className,
      )}
    >
      <div className="-mx-1 min-h-0 shrink">
        <WeekArcIllustration />
      </div>

      <div className="mt-2 grid min-h-0 flex-1 grid-cols-3 gap-2">
        {pillars.map((pillar) => (
          <article
            key={pillar.id}
            className="flex flex-col items-center justify-center gap-1 rounded-xl border-2 border-ink/10 bg-white/90 px-1 py-2 text-center"
          >
            <div className="scale-[0.72] shrink-0">{pillar.icon}</div>
            <h3 className="text-[10px] font-black leading-tight text-ink">{pillar.title}</h3>
            <p className="text-[9px] font-bold leading-tight text-ink/60">{pillar.description}</p>
          </article>
        ))}
      </div>
    </motion.section>
  )
}
