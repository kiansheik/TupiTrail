import type { SelectImageExercise as SelectImageExerciseType, SelectImageOption } from '@/core/lesson-engine/types'

import { ChoiceCard } from '@/components/ui/ChoiceCard'

type SelectImageExerciseProps = {
  exercise: SelectImageExerciseType
  selectedOptionId: string | null
  onSelect: (optionId: string) => void
}

const OptionMedia = ({ option }: { option: SelectImageOption }) => {
  if (option.imageSrc) {
    const src = option.imageSrc.startsWith('/')
      ? import.meta.env.BASE_URL + option.imageSrc.slice(1)
      : option.imageSrc
    return (
      <img
        src={src}
        alt={option.label}
        className="h-16 w-16 rounded-xl object-cover"
        draggable={false}
      />
    )
  }
  return (
    <span className={option.imageEmoji ? 'text-5xl leading-none' : 'text-2xl leading-none opacity-30'} aria-hidden>
      {option.imageEmoji || '🖼️'}
    </span>
  )
}

export const SelectImageExercise = ({
  exercise,
  selectedOptionId,
  onSelect,
}: SelectImageExerciseProps) => {
  return (
    <div className="flex flex-col gap-2">
      {!exercise.newWordBadge ? <p className="text-base font-black text-ink">{exercise.prompt}</p> : null}
      <div className="grid flex-1 auto-rows-fr grid-cols-2 gap-2">
        {exercise.options.map((option) => (
          <ChoiceCard
            key={option.id}
            selected={selectedOptionId === option.id}
            onClick={() => onSelect(option.id)}
            className="flex h-full items-center justify-center p-0"
          >
            <div className="flex h-full w-full flex-col items-center justify-center gap-1.5 rounded-[0.9rem] px-2 py-2">
              <OptionMedia option={option} />
              <span className="text-sm font-black capitalize">{option.label}</span>
            </div>
          </ChoiceCard>
        ))}
      </div>
    </div>
  )
}
