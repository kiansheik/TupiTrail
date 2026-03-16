import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

import { DialogueChoiceExercise } from '@/components/exercises/DialogueChoiceExercise'
import { ListeningTapExercise } from '@/components/exercises/ListeningTapExercise'
import { MultipleChoiceExercise } from '@/components/exercises/MultipleChoiceExercise'
import { SelectImageExercise } from '@/components/exercises/SelectImageExercise'
import { TokenTranslateExercise } from '@/components/exercises/TokenTranslateExercise'
import { ExerciseHeader } from '@/components/exercises/ExerciseHeader'
import { getExerciseHeaderMeta } from '@/components/exercises/exerciseHeaderMeta'
import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { AudioButton } from '@/components/ui/AudioButton'
import { Button } from '@/components/ui/Button'
import { FeedbackPanel } from '@/components/ui/FeedbackPanel'
import { evaluateExercise } from '@/core/lesson-engine/evaluator'
import { randomizeExerciseResponses } from '@/core/lesson-engine/randomizeResponses'
import type { Exercise, UserAnswer } from '@/core/lesson-engine/types'
import { playAudioSpec } from '@/lib/audio/speech'
import { playSfx } from '@/lib/audio/sfx'
import { builderToEngineExercises } from '@/lib/builder/converterToEngine'
import type { BuilderExercise } from '@/lib/builder/builderTypes'

// ─── Draft / answer helpers (mirrors LessonRunnerScreen) ─────────────────────

type DraftAnswer = { selectImage: string | null; choice: string | null; tokens: string[] }
const blank = (): DraftAnswer => ({ selectImage: null, choice: null, tokens: [] })

function isReady(ex: Exercise, d: DraftAnswer): boolean {
  if (ex.type === 'select_image') return Boolean(d.selectImage)
  if (ex.type === 'token_translate' || ex.type === 'listening_tap') return d.tokens.length > 0
  return Boolean(d.choice)
}

function toAnswer(ex: Exercise, d: DraftAnswer): UserAnswer {
  if (ex.type === 'select_image') return { type: 'select_image', optionId: d.selectImage ?? '' }
  if (ex.type === 'token_translate') return { type: 'token_translate', sequence: d.tokens }
  if (ex.type === 'multiple_choice_translation') return { type: 'multiple_choice_translation', choice: d.choice ?? '' }
  if (ex.type === 'dialogue_choice') return { type: 'dialogue_choice', choice: d.choice ?? '' }
  return { type: 'listening_tap', sequence: d.tokens }
}

function correctLabel(ex: Exercise): string {
  if (ex.type === 'select_image')
    return ex.options.find((o) => o.id === ex.correctOptionId)?.label ?? ex.correctOptionId
  if (ex.type === 'token_translate' || ex.type === 'listening_tap') return ex.correctSequence.join(' ')
  return ex.correctChoice
}

// ─── Dot navigation ───────────────────────────────────────────────────────────

const NavDots = ({
  total,
  current,
  answered,
  onGoto,
}: {
  total: number
  current: number
  answered: Set<number>
  onGoto: (i: number) => void
}) => (
  <div className="flex items-center gap-1.5 overflow-x-auto px-1">
    {Array.from({ length: total }, (_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onGoto(i)}
        className={`h-2 rounded-full transition-all ${
          i === current
            ? 'w-5 bg-primary'
            : answered.has(i)
              ? 'w-2 bg-primary/40'
              : 'w-2 bg-ink/15'
        }`}
        aria-label={`Exercício ${i + 1}`}
      />
    ))}
  </div>
)

// ─── Main component ───────────────────────────────────────────────────────────

type Props = {
  builderExercises: BuilderExercise[]
  onClose: () => void
}

export const LessonPreview = ({ builderExercises, onClose }: Props) => {
  const [exercises, setExercises] = useState<Exercise[]>([])
  const [loading, setLoading] = useState(builderExercises.length > 0)
  const revokeRef = useRef<() => void>(() => {})

  const [index, setIndex] = useState(0)
  const [drafts, setDrafts] = useState<Record<number, DraftAnswer>>({})
  const [checked, setChecked] = useState<Record<number, ReturnType<typeof evaluateExercise>>>({})
  const [showExplanation, setShowExplanation] = useState(false)

  // Load + convert exercises (async because of IDB audio URLs)
  useEffect(() => {
    builderToEngineExercises(builderExercises).then(({ engineExercises, revokeAll }) => {
      revokeRef.current = revokeAll
      setExercises(engineExercises)
      setLoading(false)
    })
    return () => revokeRef.current()
  }, [builderExercises])

  const ex = exercises[index] ?? null
  const draft = drafts[index] ?? blank()
  const feedback = checked[index] ?? null
  const answered = new Set(Object.keys(checked).map(Number))

  // Randomize token/choice order per exercise (stable per index)
  const rendered = ex ? randomizeExerciseResponses(ex, `preview:${ex.id}`) : null

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).tagName === 'INPUT' || (e.target as HTMLElement).tagName === 'TEXTAREA') return
      if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        setIndex((i) => Math.max(0, i - 1))
        setShowExplanation(false)
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        setIndex((i) => Math.min(exercises.length - 1, i + 1))
        setShowExplanation(false)
      } else if (e.key === 'Escape') {
        onClose()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [exercises.length, onClose])

  // Play audio when arriving at an exercise (only if no feedback yet)
  useEffect(() => {
    if (!ex || feedback) return
    if (ex.audio) playAudioSpec(ex.audio)
  }, [index, ex?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const goTo = useCallback((i: number) => {
    setIndex(i)
    setShowExplanation(false)
  }, [])

  const goNext = () => {
    setShowExplanation(false)
    setIndex((i) => Math.min(exercises.length - 1, i + 1))
  }

  const updateDraft = (patch: Partial<DraftAnswer>) =>
    setDrafts((d) => ({ ...d, [index]: { ...(d[index] ?? blank()), ...patch } }))

  const addToken = (token: string) =>
    updateDraft({ tokens: [...draft.tokens, token] })

  const removeToken = (i: number) =>
    updateDraft({ tokens: draft.tokens.filter((_, idx) => idx !== i) })

  const handleCheck = () => {
    if (!ex) return
    const answer = toAnswer(ex, draft)
    const result = evaluateExercise(ex, answer)
    setChecked((c) => ({ ...c, [index]: result }))
    if (result.isCorrect) {
      playSfx('correct')
      if (ex.type === 'dialogue_choice' && ex.answerAudio) {
        playAudioSpec(ex.answerAudio)
      } else if (ex.audio) {
        playAudioSpec(ex.audio)
      }
    } else {
      playSfx('incorrect')
    }
  }

  const handleRetry = () => {
    setChecked((c) => { const n = { ...c }; delete n[index]; return n })
    setDrafts((d) => { const n = { ...d }; delete n[index]; return n })
    setShowExplanation(false)
  }

  if (loading || !ex || !rendered) {
    return (
      <div className="absolute inset-0 z-50 flex items-center justify-center bg-shell">
        <p className="text-sm font-bold text-ink/50">Carregando preview…</p>
      </div>
    )
  }

  const headerMeta = getExerciseHeaderMeta(ex, ex.newWordBadge && ex.type === 'select_image' ? ex.prompt : undefined)
  const replayAudio = () => ex.audio && playAudioSpec(ex.audio)
  const showAudioButton =
    !headerMeta.hasPromptBubble && !headerMeta.showSelectImageWordRow && ex.type !== 'listening_tap'

  return (
    <motion.div
      className="absolute inset-0 z-50 flex flex-col bg-shell"
      initial={{ y: '100%' }}
      animate={{ y: 0 }}
      exit={{ y: '100%' }}
      transition={{ type: 'spring', stiffness: 340, damping: 34 }}
    >
      {/* ── Preview nav bar ── */}
      <div className="flex shrink-0 items-center gap-3 border-b-2 border-ink/10 bg-white px-4 py-3">
        <button
          type="button"
          onClick={onClose}
          className="shrink-0 rounded-xl border border-ink/15 bg-shell px-3 py-1.5 text-xs font-black text-ink/60 hover:bg-ink/5"
        >
          ✕ Fechar
        </button>

        {/* Dots */}
        <div className="min-w-0 flex-1">
          <NavDots total={exercises.length} current={index} answered={answered} onGoto={goTo} />
        </div>

        {/* Counter + arrows */}
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => goTo(Math.max(0, index - 1))}
            disabled={index === 0}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-ink/15 bg-shell text-sm font-black text-ink/60 transition hover:bg-ink/5 disabled:opacity-25"
          >
            ←
          </button>
          <span className="w-12 text-center text-xs font-black text-ink/50">
            {index + 1}/{exercises.length}
          </span>
          <button
            type="button"
            onClick={() => goTo(Math.min(exercises.length - 1, index + 1))}
            disabled={index === exercises.length - 1}
            className="flex h-8 w-8 items-center justify-center rounded-xl border border-ink/15 bg-shell text-sm font-black text-ink/60 transition hover:bg-ink/5 disabled:opacity-25"
          >
            →
          </button>
        </div>
      </div>

      {/* ── Exercise content — matches ScreenScaffold layout exactly ── */}
      <ScreenScaffold
        title={ex.instruction}
        bottomSlot={
          <div className="space-y-3">
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                >
                  <FeedbackPanel
                    feedback={feedback}
                    correctAnswerLabel={correctLabel(ex)}
                    message={
                      feedback.isCorrect
                        ? ex.explanation?.correct
                        : ex.explanation?.incorrect
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {feedback ? (
              <div className="flex gap-2">
                {ex.explanation && (
                  <Button
                    variant="secondary"
                    fullWidth={false}
                    className="flex-1"
                    onClick={() => setShowExplanation((v) => !v)}
                  >
                    {showExplanation ? 'Fechar' : feedback.isCorrect ? 'Explicar' : 'Por quê?'}
                  </Button>
                )}
                <Button
                  fullWidth={!ex.explanation}
                  className="flex-1"
                  onClick={index < exercises.length - 1 ? goNext : onClose}
                >
                  {index < exercises.length - 1 ? 'Continuar →' : 'Fim ✓'}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                {answered.has(index) && (
                  <Button variant="secondary" fullWidth={false} className="shrink-0" onClick={handleRetry}>
                    ↺ Tentar
                  </Button>
                )}
                <Button
                  className="flex-1"
                  disabled={!isReady(ex, draft)}
                  onClick={handleCheck}
                >
                  Verificar
                </Button>
              </div>
            )}
          </div>
        }
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={index}
            initial={{ opacity: 0, x: 24 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -24 }}
            transition={{ duration: 0.18 }}
            className="space-y-4"
          >
            <ExerciseHeader
              exercise={ex}
              currentNewWord={
                ex.newWordBadge && ex.type === 'select_image' ? ex.prompt : undefined
              }
              onReplayAudio={replayAudio}
              rightAccessory={
                ex.type === 'listening_tap' && ex.audio ? (
                  <AudioButton onClick={replayAudio} iconOnly className="h-11 w-14" />
                ) : null
              }
            />

            {showAudioButton && ex.audio && (
              <AudioButton onClick={replayAudio} label="🔊 Ouvir" />
            )}

            {ex.type === 'select_image' && (
              <SelectImageExercise
                exercise={rendered.type === 'select_image' ? rendered : ex}
                selectedOptionId={draft.selectImage}
                onSelect={(id) => !feedback && updateDraft({ selectImage: id })}
              />
            )}
            {ex.type === 'token_translate' && (
              <TokenTranslateExercise
                exercise={rendered.type === 'token_translate' ? rendered : ex}
                selectedTokens={draft.tokens}
                onAddToken={(t) => !feedback && addToken(t)}
                onRemoveToken={(i) => !feedback && removeToken(i)}
              />
            )}
            {ex.type === 'multiple_choice_translation' && (
              <MultipleChoiceExercise
                exercise={rendered.type === 'multiple_choice_translation' ? rendered : ex}
                selectedChoice={draft.choice}
                onSelect={(c) => !feedback && updateDraft({ choice: c })}
              />
            )}
            {ex.type === 'dialogue_choice' && (
              <DialogueChoiceExercise
                exercise={rendered.type === 'dialogue_choice' ? rendered : ex}
                selectedChoice={draft.choice}
                omitFirstServerLine={Boolean(headerMeta.dialogueHeaderText)}
                onSelect={(c) => !feedback && updateDraft({ choice: c })}
              />
            )}
            {ex.type === 'listening_tap' && (
              <ListeningTapExercise
                exercise={rendered.type === 'listening_tap' ? rendered : ex}
                selectedTokens={draft.tokens}
                onAddToken={(t) => !feedback && addToken(t)}
                onRemoveToken={(i) => !feedback && removeToken(i)}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </ScreenScaffold>

      {/* ── Grammar explanation sheet ── */}
      <AnimatePresence>
        {showExplanation && ex.explanation && (
          <motion.div
            className="absolute inset-0 z-60 flex items-end bg-ink/40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowExplanation(false)}
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              exit={{ y: 30 }}
              className="w-full rounded-t-3xl bg-white p-5 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="font-display text-2xl text-ink">Explicação</h3>
              <p className="mt-2 text-sm font-semibold text-ink/80">
                {feedback?.isCorrect ? ex.explanation.correct : ex.explanation.incorrect}
              </p>
              {ex.explanation.grammarNotes?.length ? (
                <ul className="mt-3 space-y-1">
                  {ex.explanation.grammarNotes.map((n) => (
                    <li key={n.label} className="text-sm font-semibold text-ink/70">
                      <strong>{n.label}:</strong> {n.text}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4">
                <Button variant="secondary" onClick={() => setShowExplanation(false)}>
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
