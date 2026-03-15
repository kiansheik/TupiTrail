import type { ListeningTapExercise as ListeningTapExerciseType } from '@/core/lesson-engine/types'

import { TokenBank } from '@/components/ui/TokenBank'

type ListeningTapExerciseProps = {
  exercise: ListeningTapExerciseType
  selectedTokens: string[]
  onAddToken: (token: string, index: number) => void
  onRemoveToken: (index: number) => void
}

export const ListeningTapExercise = ({
  exercise,
  selectedTokens,
  onAddToken,
  onRemoveToken,
}: ListeningTapExerciseProps) => {
  return (
    <div className="space-y-4">
      <p className="rounded-2xl border-2 border-ink/10 bg-white p-3 text-base font-bold text-ink/70">
        Toque nos tokens para montar o que você ouviu.
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
