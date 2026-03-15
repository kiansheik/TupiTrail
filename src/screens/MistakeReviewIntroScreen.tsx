import { useNavigate, useParams } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
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
    <ScreenScaffold
      title={uiStrings.noPenaltyMistakes}
      subtitle={uiStrings.noEnergyHint}
      bottomSlot={<Button onClick={onContinue}>Corrigir agora</Button>}
    >
      <Card className="space-y-3 text-center">
        <div className="flex justify-center">
          <CharacterAvatar id="bear" mood="encouraging" />
        </div>
        <p className="text-base font-bold text-ink/75">
          Você vai rever somente o que errou, na ordem em que os erros apareceram.
        </p>
      </Card>
    </ScreenScaffold>
  )
}
