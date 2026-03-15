import type { MultipleChoiceTranslationExercise } from '@/core/lesson-engine/types'

import { ChoiceCard } from '@/components/ui/ChoiceCard'

type MultipleChoiceExerciseProps = {
  exercise: MultipleChoiceTranslationExercise
  selectedChoice: string | null
  onSelect: (choice: string) => void
}

export const MultipleChoiceExercise = ({
  exercise,
  selectedChoice,
  onSelect,
}: MultipleChoiceExerciseProps) => {
  return (
    <div className="space-y-4">
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
