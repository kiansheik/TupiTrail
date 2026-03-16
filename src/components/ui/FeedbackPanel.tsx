import { useState } from 'react'
import { motion } from 'framer-motion'

import type { EvaluationResult } from '@/core/lesson-engine/types'
import { randomCorrectMessage, randomIncorrectMessage } from '@/lib/feedback/fallbackMessages'

export type FeedbackPanelProps = {
  feedback: EvaluationResult
  correctAnswerLabel: string
  /** Optional custom message (from exercise explanation). Falls back to a random pool message. */
  message?: string
}

export const FeedbackPanel = ({ feedback, correctAnswerLabel, message }: FeedbackPanelProps) => {
  const positive = feedback.isCorrect

  // Pick a fallback once per mount — stable even if parent re-renders
  const [fallback] = useState(() =>
    positive ? randomCorrectMessage() : randomIncorrectMessage(),
  )

  const displayMessage = message?.trim() || fallback

  return (
    <motion.div
      initial={{ y: 24, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 24, opacity: 0 }}
      className={`rounded-2xl border-2 p-3 ${
        positive ? 'border-success/50 bg-success/15' : 'border-danger/50 bg-danger/10'
      }`}
    >
      <h3 className={`font-display text-xl ${positive ? 'text-green-700' : 'text-rose-700'}`}>
        {positive ? 'Correto!' : 'Quase!'}
      </h3>
      <p className="mt-1 text-sm font-semibold text-ink/70">{displayMessage}</p>
      {!positive ? (
        <p className="mt-1 text-sm font-semibold text-ink/70">Resposta correta: {correctAnswerLabel}</p>
      ) : null}
      {feedback.meaning ? <p className="mt-2 text-sm font-semibold text-ink/70">Significado: {feedback.meaning}</p> : null}
    </motion.div>
  )
}
