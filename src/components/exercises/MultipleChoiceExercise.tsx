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
      <p className="rounded-2xl border-2 border-ink/10 bg-white p-3 text-lg font-black text-ink">{exercise.prompt}</p>
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
