import { motion } from 'framer-motion'
import { useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
import { LessonSummaryCard } from '@/components/ui/LessonSummaryCard'
import { lessonById } from '@/data/course'
import { uiStrings } from '@/data/ui'
import { playSfx } from '@/lib/audio/sfx'
import { useAppStore } from '@/store/useAppStore'
import { useLessonSessionStore } from '@/store/useLessonSessionStore'

// ---- Hero SVG: glowing star trophy ----
const TrophyStar = () => (
  <svg viewBox="0 0 120 120" className="h-28 w-28" aria-hidden>
    <defs>
      <radialGradient id="starFill" cx="50%" cy="38%" r="62%">
        <stop offset="0%" stopColor="#fff3a0" />
        <stop offset="55%" stopColor="#ffd166" />
        <stop offset="100%" stopColor="#f4a22a" />
      </radialGradient>
      <radialGradient id="glowRing" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#ffd166" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#ffd166" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Soft outer glow rings */}
    <circle cx="60" cy="60" r="56" fill="url(#glowRing)" />
    <circle cx="60" cy="60" r="48" fill="rgba(255,209,102,0.10)" />
    {/* Star shape — 5-pointed */}
    <polygon
      points="60,8 72,44 110,44 80,66 92,102 60,80 28,102 40,66 10,44 48,44"
      fill="url(#starFill)"
      stroke="#f4a22a"
      strokeWidth="2"
      strokeLinejoin="round"
    />
    {/* Shine specular */}
    <ellipse cx="48" cy="38" rx="6" ry="4" fill="rgba(255,255,255,0.55)" transform="rotate(-20 48 38)" />
    <circle cx="42" cy="52" r="2.5" fill="rgba(255,255,255,0.30)" />
  </svg>
)

// ---- Floating sparkle particle ----
type SparklePos = { left: string; top: string }

const Sparkle = ({
  pos,
  delay,
  size = 12,
}: {
  pos: SparklePos
  delay: number
  size?: number
}) => (
  <motion.div
    className="pointer-events-none absolute"
    style={pos}
    initial={{ scale: 0, opacity: 0 }}
    animate={{
      scale: [0, 1.3, 1, 1.3, 0],
      opacity: [0, 1, 0.75, 1, 0],
      rotate: [0, 45, 90, 135, 180],
    }}
    transition={{
      delay,
      duration: 2.6,
      repeat: Infinity,
      repeatDelay: 1.2,
      ease: 'easeInOut',
    }}
  >
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden>
      <path
        d="M12 2L13.6 9.4 21 11 13.6 12.6 12 20 10.4 12.6 3 11 10.4 9.4Z"
        fill="#ffd166"
        stroke="#f4a22a"
        strokeWidth="0.8"
        strokeLinejoin="round"
      />
    </svg>
  </motion.div>
)

const sparkles: Array<{ pos: SparklePos; delay: number; size: number }> = [
  { pos: { left: '6%', top: '5%' }, delay: 0.1, size: 14 },
  { pos: { left: '80%', top: '2%' }, delay: 0.45, size: 11 },
  { pos: { left: '88%', top: '44%' }, delay: 0.8, size: 9 },
  { pos: { left: '4%', top: '48%' }, delay: 1.1, size: 12 },
  { pos: { left: '46%', top: '1%' }, delay: 0.65, size: 8 },
  { pos: { left: '68%', top: '68%' }, delay: 1.4, size: 10 },
  { pos: { left: '18%', top: '72%' }, delay: 0.9, size: 9 },
]

// ---- Screen ----
export const LessonCompleteScreen = () => {
  const navigate = useNavigate()
  const params = useParams<{ lessonId: string }>()
  const lessonId = params.lessonId ?? 'unit1-lesson1'

  const buildLessonResult = useLessonSessionStore((state) => state.buildLessonResult)
  const lesson = useLessonSessionStore((state) => state.lesson)
  const restoreLesson = useLessonSessionStore((state) => state.restoreLesson)
  const resetSession = useLessonSessionStore((state) => state.reset)
  const applyLessonResult = useAppStore((state) => state.applyLessonResult)
  const lessonResume = useAppStore((state) => state.lessonResume)
  const result = buildLessonResult()

  useEffect(() => {
    playSfx('finish')
  }, [])

  useEffect(() => {
    if (result || lesson || !lessonResume || lessonResume.lessonId !== lessonId) {
      return
    }

    const lessonFromData = lessonById.get(lessonResume.lessonId)
    if (!lessonFromData) {
      return
    }

    restoreLesson(lessonFromData, lessonResume)
  }, [result, lesson, lessonResume, lessonId, restoreLesson])

  if (!result) {
    return (
      <ScreenScaffold
        title="Resumo indisponível"
        bottomSlot={<Button onClick={() => navigate(`/lesson/${lessonId}/intro`)}>Recomeçar</Button>}
      >
        <p className="text-sm font-bold text-ink/70">Finalize a lição para ver este resumo.</p>
      </ScreenScaffold>
    )
  }

  const claim = () => {
    applyLessonResult(result)
    resetSession()
    navigate('/streak/ignite')
  }

  return (
    <ScreenScaffold bottomSlot={<Button onClick={claim}>{uiStrings.claimXp}</Button>}>
      <div className="flex flex-col gap-4">
        {/* ---- Hero: trophy + sparkles + title ---- */}
        <div className="relative flex flex-col items-center pb-2 pt-1">
          {sparkles.map((s, i) => (
            <Sparkle key={i} pos={s.pos} delay={s.delay} size={s.size} />
          ))}

          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: -8 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 170, damping: 12, delay: 0.05 }}
            style={{ filter: 'drop-shadow(0 0 14px rgba(255,209,102,0.65)) drop-shadow(0 4px 8px rgba(244,162,42,0.35))' }}
          >
            <TrophyStar />
          </motion.div>

          <motion.h1
            className="font-display text-3xl leading-tight text-ink"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.28 }}
          >
            Vitória!
          </motion.h1>

          <motion.p
            className="mt-1 text-sm font-semibold text-ink/60"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.46 }}
          >
            Você concluiu a primeira lição
          </motion.p>
        </div>

        {/* ---- Motivational card ---- */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.38, type: 'spring', stiffness: 190, damping: 18 }}
          className="flex items-center gap-3 rounded-3xl border-2 border-accent bg-yellow-100 p-4"
        >
          <CharacterAvatar id="bird" mood="happy" />
          <p className="text-sm font-black text-yellow-800">
            Hábito diário vence intensidade. Volte amanhã para manter sua ofensiva.
          </p>
        </motion.div>

        {/* ---- Stats grid ---- */}
        <LessonSummaryCard result={result} />
      </div>
    </ScreenScaffold>
  )
}
