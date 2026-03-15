import type { LessonResult } from '@/core/lesson-engine/types'
import { durationLabel } from '@/core/lesson-engine/progress'

export const LessonSummaryCard = ({ result }: { result: LessonResult }) => {
  return (
    <div className="rounded-3xl border-2 border-success/40 bg-white p-4">
      <h3 className="font-display text-2xl text-ink">Resumo da lição</h3>
      <ul className="mt-3 space-y-2 text-sm font-bold text-ink/80">
        <li>XP: +{result.xpEarned}</li>
        <li>Precisão: {result.accuracy}%</li>
        <li>Tempo: {durationLabel(result.durationSec)}</li>
        <li>Melhor combo: x{result.bestCombo}</li>
      </ul>
    </div>
  )
}
