import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

import type { LessonResult } from '@/core/lesson-engine/types'
import { durationLabel } from '@/core/lesson-engine/progress'

function useCountUp(target: number, duration = 1000) {
  const [value, setValue] = useState(0)
  const rafRef = useRef(0)

  useEffect(() => {
    const start = Date.now()
    const tick = () => {
      const elapsed = Date.now() - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setValue(Math.round(eased * target))
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(rafRef.current)
  }, [target, duration])

  return value
}

const XpIcon = () => (
  <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
    <polygon
      points="20,3 24.5,14.5 37,14.5 27,22 30.5,33.5 20,27 9.5,33.5 13,22 3,14.5 15.5,14.5"
      fill="#ffd166"
      stroke="#f4a22a"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
    <circle cx="30" cy="11" r="3" fill="rgba(255,255,255,0.55)" />
  </svg>
)

const TargetIcon = () => (
  <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
    <circle cx="20" cy="20" r="17" fill="none" stroke="#2eb489" strokeWidth="2.5" />
    <circle cx="20" cy="20" r="11" fill="none" stroke="#2eb489" strokeWidth="2" />
    <circle cx="20" cy="20" r="5.5" fill="#2eb489" />
    <line x1="20" y1="2" x2="20" y2="7" stroke="#2eb489" strokeWidth="2" strokeLinecap="round" />
    <line x1="20" y1="33" x2="20" y2="38" stroke="#2eb489" strokeWidth="2" strokeLinecap="round" />
    <line x1="2" y1="20" x2="7" y2="20" stroke="#2eb489" strokeWidth="2" strokeLinecap="round" />
    <line x1="33" y1="20" x2="38" y2="20" stroke="#2eb489" strokeWidth="2" strokeLinecap="round" />
  </svg>
)

const ClockIcon = () => (
  <svg viewBox="0 0 40 40" className="h-9 w-9" aria-hidden>
    <circle cx="20" cy="20" r="16" fill="none" stroke="#06d6a0" strokeWidth="2.5" />
    <circle cx="20" cy="20" r="2" fill="#06d6a0" />
    <line x1="20" y1="10" x2="20" y2="21" stroke="#06d6a0" strokeWidth="2.5" strokeLinecap="round" />
    <line x1="20" y1="21" x2="27" y2="26" stroke="#06d6a0" strokeWidth="2.5" strokeLinecap="round" />
  </svg>
)

const MiniFlame = () => (
  <svg viewBox="0 0 32 40" className="h-9 w-7" aria-hidden>
    <path
      d="M16 38C7 33 3 26 5 16C7 8 14 4 16 0C16 0 14 10 20 14C20 7 24 3 27 0C32 9 34 20 29 28C26 33 22 38 16 38Z"
      fill="#ef476f"
    />
    <path
      d="M16 32C11 28 8 22 10 15C12 10 15 7 16 3C17 7 15 12 19 17C21 12 23 8 24 4C28 11 29 21 25 28C22 31 19 33 16 32Z"
      fill="#ffd166"
    />
  </svg>
)

export const LessonSummaryCard = ({ result }: { result: LessonResult }) => {
  const xp = useCountUp(result.xpEarned, 900)
  const acc = useCountUp(result.accuracy, 1100)

  const stats = [
    {
      icon: <XpIcon />,
      label: 'XP',
      value: `+${xp}`,
      bg: 'bg-yellow-50',
      border: 'border-yellow-300',
      textColor: 'text-yellow-700',
    },
    {
      icon: <TargetIcon />,
      label: 'Precisão',
      value: `${acc}%`,
      bg: 'bg-primary/5',
      border: 'border-primary/30',
      textColor: 'text-primary',
    },
    {
      icon: <ClockIcon />,
      label: 'Tempo',
      value: durationLabel(result.durationSec),
      bg: 'bg-success/5',
      border: 'border-success/30',
      textColor: 'text-success',
    },
    {
      icon: <MiniFlame />,
      label: 'Combo',
      value: `x${result.bestCombo}`,
      bg: 'bg-red-50',
      border: 'border-red-200',
      textColor: 'text-red-500',
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 18, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ delay: i * 0.09 + 0.25, type: 'spring', stiffness: 220, damping: 18 }}
          className={`flex flex-col items-center gap-1.5 rounded-2xl border-2 ${stat.border} ${stat.bg} px-3 py-4`}
        >
          {stat.icon}
          <span className={`text-2xl font-black ${stat.textColor}`}>{stat.value}</span>
          <span className="text-xs font-bold uppercase tracking-wide text-ink/50">{stat.label}</span>
        </motion.div>
      ))}
    </div>
  )
}
