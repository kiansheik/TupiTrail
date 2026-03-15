import { motion } from 'framer-motion'

import type { EvaluationResult } from '@/core/lesson-engine/types'

export type FeedbackPanelProps = {
  feedback: EvaluationResult
  correctAnswerLabel: string
}

export const FeedbackPanel = ({ feedback, correctAnswerLabel }: FeedbackPanelProps) => {
  const positive = feedback.isCorrect

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      className={`rounded-3xl border-2 p-4 ${
        positive ? 'border-success/50 bg-success/15' : 'border-danger/50 bg-danger/10'
      }`}
    >
      <h3 className={`font-display text-2xl ${positive ? 'text-green-700' : 'text-rose-700'}`}>
        {positive ? 'Correto!' : 'Quase!'}
      </h3>
      {!positive ? (
        <p className="mt-1 text-sm font-semibold text-ink/70">Resposta correta: {correctAnswerLabel}</p>
      ) : null}
      {feedback.meaning ? <p className="mt-2 text-sm font-semibold text-ink/70">Significado: {feedback.meaning}</p> : null}
    </motion.div>
  )
}
