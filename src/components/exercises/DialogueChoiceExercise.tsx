import type { DialogueChoiceExercise as DialogueChoiceExerciseType } from '@/core/lesson-engine/types'

import { ChoiceCard } from '@/components/ui/ChoiceCard'
import { SpeechBubble } from '@/components/ui/SpeechBubble'

type DialogueChoiceExerciseProps = {
  exercise: DialogueChoiceExerciseType
  selectedChoice: string | null
  onSelect: (choice: string) => void
  omitFirstServerLine?: boolean
}

export const DialogueChoiceExercise = ({
  exercise,
  selectedChoice,
  onSelect,
  omitFirstServerLine = false,
}: DialogueChoiceExerciseProps) => {
  const visibleDialogue = omitFirstServerLine
    ? exercise.dialogue.filter(
        (line, index) => !(index === 0 && line.speaker.trim().toLowerCase() === 'server' && !line.isBlank),
      )
    : exercise.dialogue

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        {visibleDialogue.map((line, index) => {
          const isUserLine = line.speaker.trim().toLowerCase() === 'you'

          return (
            <div
              key={`${line.speaker}-${index}`}
              className={isUserLine ? 'ml-10 flex flex-col items-end' : 'mr-10 flex flex-col items-start'}
            >
              <p className="mb-1 text-xs font-black uppercase text-ink/45">{line.speaker}</p>
              <SpeechBubble
                tail={isUserLine ? 'right' : 'left'}
                className={isUserLine ? 'border-[#b7e2c8] bg-[#e8f8ef]' : 'border-[#b8ccff] bg-[#eef4ff]'}
                tailClassName={isUserLine ? 'border-[#b7e2c8] bg-[#e8f8ef]' : 'border-[#b8ccff] bg-[#eef4ff]'}
              >
                {line.isBlank ? '...' : line.text}
              </SpeechBubble>
            </div>
          )
        })}
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
