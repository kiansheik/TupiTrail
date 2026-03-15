import type { TokenTranslateExercise as TokenTranslateExerciseType } from '@/core/lesson-engine/types'

import { TokenBank } from '@/components/ui/TokenBank'

type TokenTranslateExerciseProps = {
  exercise: TokenTranslateExerciseType
  selectedTokens: string[]
  onAddToken: (token: string, index: number) => void
  onRemoveToken: (index: number) => void
}

export const TokenTranslateExercise = ({
  exercise,
  selectedTokens,
  onAddToken,
  onRemoveToken,
}: TokenTranslateExerciseProps) => {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl border-2 border-ink/10 bg-white p-3 text-lg font-extrabold text-ink">
        {exercise.sourceText.map((segment, index) => (
          <span
            key={`${segment.text}-${index}`}
            className={segment.highlight === 'new-word' ? 'new-word-fancy inline-block px-1' : ''}
          >
            {segment.text}
          </span>
        ))}
      </p>
      <TokenBank
        tokens={exercise.tokenBank}
        selectedTokens={selectedTokens}
        onAddToken={onAddToken}
        onRemoveToken={onRemoveToken}
      />
    </div>
  )
}
