import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { TamaChatAvatar } from '@/components/ui/TamaChatAvatar'
import { lessonById } from '@/data/course'
import { useLessonSessionStore } from '@/store/useLessonSessionStore'

export const LessonIntroScreen = () => {
  const navigate = useNavigate()
  const params = useParams<{ lessonId: string }>()
  const lessonId = params.lessonId ?? 'unit1-lesson1'
  const lesson = lessonById.get(lessonId) ?? lessonById.get('unit1-lesson1')
  const startLesson = useLessonSessionStore((state) => state.startLesson)

  if (!lesson) {
    return null
  }

  const onContinue = () => {
    startLesson(lesson)
    navigate(`/lesson/${lesson.id}/run`)
  }

  return (
    <ScreenScaffold
      title={lesson.title}
      subtitle={`${lesson.subtitle} · ${lesson.estimatedMinutes} min`}
      contentClassName="h-full"
      bottomSlot={<Button onClick={onContinue}>Continuar</Button>}
    >
      <div className="flex h-full min-h-0">
        <div className="relative mt-auto min-h-[240px] flex-1 overflow-hidden rounded-[1.6rem] border-2 border-ink/20 bg-[linear-gradient(180deg,#ecfbf4_0%,#fff3dd_100%)]">
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
              <p className="mt-1 font-display text-2xl leading-tight text-ink">Primeira lição pronta</p>
              <p className="mt-1 text-sm font-extrabold text-ink/70">
                Sequência com revisão de erros, combo e feedback explicável.
              </p>
            </div>
          </motion.div>
        </div>
      </div>
    </ScreenScaffold>
  )
}
