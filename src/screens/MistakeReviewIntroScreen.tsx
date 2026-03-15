import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { TamaChatAvatar } from '@/components/ui/TamaChatAvatar'
import { uiStrings } from '@/data/ui'
import { useLessonSessionStore } from '@/store/useLessonSessionStore'

export const MistakeReviewIntroScreen = () => {
  const navigate = useNavigate()
  const params = useParams<{ lessonId: string }>()
  const lessonId = params.lessonId ?? 'unit1-lesson1'
  const beginReview = useLessonSessionStore((state) => state.beginReview)

  const onContinue = () => {
    beginReview()
    navigate(`/lesson/${lessonId}/run`)
  }

  return (
    <ScreenScaffold contentClassName="h-full" bottomSlot={<Button onClick={onContinue}>Corrigir agora</Button>}>
      <div className="flex h-full min-h-0 items-center">
        <div className="relative h-[clamp(240px,52vh,340px)] w-full overflow-hidden rounded-[1.6rem] border-2 border-ink/20 bg-[linear-gradient(180deg,#ecfbf4_0%,#fff3dd_100%)]">
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[radial-gradient(ellipse_at_center,_rgba(46,180,137,0.2),_transparent_70%)]" />

          <div className="absolute left-2 top-2 origin-top-left scale-[0.56]">
            <TamaChatAvatar enterFrom="left" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, delay: 0.08 }}
            className="absolute left-[5.2rem] right-3 top-4"
          >
            <div className="relative rounded-[1.25rem] border-2 border-ink/20 bg-white/95 px-4 py-3 shadow-[0_8px_0_rgba(27,43,38,0.08)]">
              <div className="absolute -left-2 top-5 h-3.5 w-3.5 rotate-45 border-b-2 border-l-2 border-ink/20 bg-white/95" />
              <p className="text-[11px] font-black uppercase tracking-[0.08em] text-ink/55">Tama</p>
              <p className="mt-1 font-display text-2xl leading-tight text-ink">{uiStrings.noPenaltyMistakes}</p>
              <p className="mt-1 text-sm font-extrabold text-ink/70">{uiStrings.noEnergyHint}</p>
              <p className="mt-2 text-sm font-bold leading-snug text-ink/75">{uiStrings.reviewOrderHint}</p>
            </div>
          </motion.div>
        </div>
      </div>
    </ScreenScaffold>
  )
}
