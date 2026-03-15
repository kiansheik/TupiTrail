import { useNavigate, useParams } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
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
      bottomSlot={<Button onClick={onContinue}>Continuar</Button>}
    >
      <Card className="flex items-center gap-4">
        <CharacterAvatar id="bird" mood="encouraging" />
        <div>
          <p className="font-display text-2xl text-ink">Primeira lição pronta</p>
          <p className="text-sm font-bold text-ink/70">
            Sequência com revisão de erros, combo e feedback explicável.
          </p>
        </div>
      </Card>
    </ScreenScaffold>
  )
}
