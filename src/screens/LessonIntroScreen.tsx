import { motion } from 'framer-motion'
import { useNavigate, useParams } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { SpeechBubble } from '@/components/ui/SpeechBubble'
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
      <div className="flex h-full min-h-0 flex-col gap-3">
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="max-w-[88%]"
        >
          <SpeechBubble>
            <p className="font-display text-2xl leading-tight text-ink">Primeira lição pronta</p>
            <p className="mt-1 text-sm font-extrabold text-ink/70">
              Sequência com revisão de erros, combo e feedback explicável.
            </p>
          </SpeechBubble>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.25, delay: 0.1 }}
          className="ml-auto max-w-[78%]"
        >
          <div className="relative rounded-3xl border-2 border-ink/20 bg-primary/12 p-3 text-right">
            <p className="text-sm font-black text-ink">Bora comecar? Quero ver combo alto hoje.</p>
            <div className="absolute -bottom-2 right-6 h-4 w-4 rotate-45 border-b-2 border-l-2 border-ink/20 bg-primary/12" />
          </div>
        </motion.div>

        <div className="relative mt-auto min-h-[240px] flex-1 overflow-hidden rounded-[1.6rem] border-2 border-ink/20 bg-[linear-gradient(180deg,#ecfbf4_0%,#fff3dd_100%)]">
          <div className="absolute inset-x-0 bottom-0 h-20 bg-[radial-gradient(ellipse_at_center,_rgba(46,180,137,0.2),_transparent_70%)]" />
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25, delay: 0.2 }}
            className="absolute left-4 top-4 max-w-[58%]"
          >
            <div className="relative rounded-2xl border-2 border-ink/20 bg-white px-3 py-2">
              <p className="text-xs font-black uppercase tracking-[0.08em] text-ink/50">Tama</p>
              <p className="text-sm font-extrabold text-ink/80">Toque em continuar e eu te guio passo a passo.</p>
              <div className="absolute -bottom-2 left-6 h-4 w-4 rotate-45 border-b-2 border-r-2 border-ink/20 bg-white" />
            </div>
          </motion.div>

          <div className="absolute -bottom-3 -right-8">
            <TamaChatAvatar />
          </div>
        </div>
      </div>
    </ScreenScaffold>
  )
}
