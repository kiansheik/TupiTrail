import type { ReactNode } from 'react'

import { AudioButton } from '@/components/ui/AudioButton'
import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
import { NewWordBadge, NewWordWord } from '@/components/ui/NewWordBadge'
import { SpeechBubble } from '@/components/ui/SpeechBubble'
import type { Exercise } from '@/core/lesson-engine/types'
import { getExerciseHeaderMeta } from '@/components/exercises/exerciseHeaderMeta'

type ExerciseHeaderProps = {
  exercise: Exercise
  currentNewWord?: string
  onReplayAudio: () => void
  rightAccessory?: ReactNode
}

export const ExerciseHeader = ({ exercise, currentNewWord, onReplayAudio, rightAccessory }: ExerciseHeaderProps) => {
  const meta = getExerciseHeaderMeta(exercise, currentNewWord)
  const showDialogueHeaderRow = Boolean(meta.dialogueHeaderText)
  const showMultipleChoiceHeaderRow = Boolean(meta.multipleChoicePromptText)
  const canShowAccessory =
    !meta.hasPromptBubble && !meta.showSelectImageWordRow && !showDialogueHeaderRow && !showMultipleChoiceHeaderRow

  return (
    <div className={`flex items-start ${meta.isTokenTranslatePrompt ? 'gap-1' : 'gap-3'}`}>
      <div className="flex shrink-0 flex-col items-start gap-2">
        {exercise.newWordBadge ? <NewWordBadge word={currentNewWord} /> : null}
        <CharacterAvatar id={exercise.character?.id ?? 'bird'} mood={exercise.character?.mood} />
      </div>

      {meta.hasPromptBubble ? (
        <div className={`min-w-0 flex-1 ${meta.isTokenTranslatePrompt ? '-ml-1 pt-0.5' : 'pt-1'}`}>
          <div className="flex items-start gap-2">
            <div className="min-w-0 flex-1">
              <SpeechBubble tail={meta.isTokenTranslatePrompt ? 'left' : 'left'}>
                <p className="text-lg font-black leading-snug text-ink">
                  {exercise.promptSegments && exercise.promptSegments.length > 0
                    ? exercise.promptSegments.map((segment, index) => (
                        <span
                          key={`${segment.text}-${index}`}
                          className={segment.highlight === 'new-word' ? 'new-word-fancy inline-block px-1' : ''}
                        >
                          {segment.text}
                        </span>
                      ))
                    : null}
                </p>
              </SpeechBubble>
            </div>
            {exercise.audio ? <AudioButton onClick={onReplayAudio} iconOnly /> : null}
          </div>
        </div>
      ) : null}

      {meta.showSelectImageWordRow ? (
        <div className="flex min-w-0 flex-1 items-center gap-2 pt-[57px] -ml-5">
          {exercise.audio ? <AudioButton onClick={onReplayAudio} iconOnly /> : null}
          {currentNewWord ? (
            <div className="min-w-0 flex-1">
              <NewWordWord
                word={currentNewWord}
                autoFit
                className="block w-full whitespace-nowrap font-black uppercase tracking-[0.01em]"
              />
            </div>
          ) : null}
        </div>
      ) : null}

      {showDialogueHeaderRow ? (
        <div className="min-w-0 flex-1 pt-1">
          <p className="mb-1 text-xs font-black uppercase text-ink/45">Server</p>
          <SpeechBubble className="border-[#b8ccff] bg-[#eef4ff]" tailClassName="border-[#b8ccff] bg-[#eef4ff]">
            {meta.dialogueHeaderText}
          </SpeechBubble>
        </div>
      ) : null}

      {showMultipleChoiceHeaderRow ? (
        <div className="min-w-0 flex-1 pt-1">
          <p className="mb-1 text-xs font-black uppercase text-ink/45">Server</p>
          <SpeechBubble className="border-[#b8ccff] bg-[#eef4ff]" tailClassName="border-[#b8ccff] bg-[#eef4ff]">
            <p className="text-xl font-black leading-tight text-ink">{meta.multipleChoicePromptText}</p>
          </SpeechBubble>
        </div>
      ) : null}

      {canShowAccessory && rightAccessory ? <div className="min-w-0 flex-1 pt-7">{rightAccessory}</div> : null}
    </div>
  )
}
