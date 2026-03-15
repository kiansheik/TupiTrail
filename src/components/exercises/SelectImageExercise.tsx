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
    <div className="flex min-h-[360px] flex-col gap-4">
      {!exercise.newWordBadge ? <p className="text-xl font-black text-ink">{exercise.prompt}</p> : null}
      <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-3">
        {exercise.options.map((option) => (
          <ChoiceCard
            key={option.id}
            selected={selectedOptionId === option.id}
            onClick={() => onSelect(option.id)}
            className="flex h-full min-h-[138px] items-center justify-center p-0"
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-[0.9rem] px-2 py-3">
              <span className="text-6xl leading-none" aria-hidden>
                {option.imageEmoji}
              </span>
              <span className="text-base font-black capitalize">{option.label}</span>
            </div>
          </ChoiceCard>
        ))}
      </div>
    </div>
  )
}
