import type { SelectImageExercise as SelectImageExerciseType } from '@/core/lesson-engine/types'

import { ChoiceCard } from '@/components/ui/ChoiceCard'

type SelectImageExerciseProps = {
  exercise: SelectImageExerciseType
  selectedOptionId: string | null
  onSelect: (optionId: string) => void
}

export const SelectImageExercise = ({
  exercise,
  selectedOptionId,
  onSelect,
}: SelectImageExerciseProps) => {
  return (
    <div className="space-y-4">
      <p className="text-lg font-black text-ink">{exercise.prompt}</p>
      <div className="grid grid-cols-2 gap-3">
        {exercise.options.map((option) => (
          <ChoiceCard
            key={option.id}
            selected={selectedOptionId === option.id}
            onClick={() => onSelect(option.id)}
          >
            <div className="flex flex-col items-center gap-2 py-3">
              <span className="text-4xl" aria-hidden>
                {option.imageEmoji}
              </span>
              <span className="text-sm font-black">{option.label}</span>
            </div>
          </ChoiceCard>
        ))}
      </div>
    </div>
  )
}
