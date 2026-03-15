import type { DialogueChoiceExercise as DialogueChoiceExerciseType } from '@/core/lesson-engine/types'

import { ChoiceCard } from '@/components/ui/ChoiceCard'
import { SpeechBubble } from '@/components/ui/SpeechBubble'

type DialogueChoiceExerciseProps = {
  exercise: DialogueChoiceExerciseType
  selectedChoice: string | null
  onSelect: (choice: string) => void
}

export const DialogueChoiceExercise = ({
  exercise,
  selectedChoice,
  onSelect,
}: DialogueChoiceExerciseProps) => {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {exercise.dialogue.map((line, index) => (
          <div key={`${line.speaker}-${index}`}>
            <p className="mb-1 text-xs font-black uppercase text-ink/45">{line.speaker}</p>
            <SpeechBubble>{line.isBlank ? '...' : line.text}</SpeechBubble>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        {exercise.choices.map((choice) => (
          <ChoiceCard key={choice} selected={selectedChoice === choice} onClick={() => onSelect(choice)}>
            {choice}
          </ChoiceCard>
        ))}
      </div>
    </div>
  )
}
