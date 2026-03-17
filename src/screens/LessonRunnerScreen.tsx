import { AnimatePresence, motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { SelectImageExercise } from '@/components/exercises/SelectImageExercise'
import { TokenTranslateExercise } from '@/components/exercises/TokenTranslateExercise'
import { MultipleChoiceExercise } from '@/components/exercises/MultipleChoiceExercise'
import { DialogueChoiceExercise } from '@/components/exercises/DialogueChoiceExercise'
import { ListeningTapExercise } from '@/components/exercises/ListeningTapExercise'
import { ExerciseHeader } from '@/components/exercises/ExerciseHeader'
import { getExerciseHeaderMeta } from '@/components/exercises/exerciseHeaderMeta'
import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { AudioButton } from '@/components/ui/AudioButton'
import { Button } from '@/components/ui/Button'
import { ComboBanner } from '@/components/ui/ComboBanner'
import { FeedbackPanel } from '@/components/ui/FeedbackPanel'
import { SlowAudioButton } from '@/components/ui/SlowAudioButton'
import { evaluateExercise } from '@/core/lesson-engine/evaluator'
import { randomizeExerciseResponses } from '@/core/lesson-engine/randomizeResponses'
import { getCurrentExerciseId, type LessonQueueState } from '@/core/lesson-engine/session'
import type { Exercise, UserAnswer } from '@/core/lesson-engine/types'
import { lessonById } from '@/data/course'
import { playSfx } from '@/lib/audio/sfx'
import { playAudioSpec } from '@/lib/audio/speech'
import { useAppStore } from '@/store/useAppStore'
import { useLessonSessionStore } from '@/store/useLessonSessionStore'

const isAnswerReady = (exercise: Exercise, draft: DraftAnswer): boolean => {
  if (exercise.type === 'select_image') {
    return Boolean(draft.selectImage)
  }

  if (exercise.type === 'token_translate' || exercise.type === 'listening_tap') {
    return draft.tokens.length > 0
  }

  return Boolean(draft.choice)
}

type DraftAnswer = {
  selectImage: string | null
  choice: string | null
  tokens: string[]
}

const blankDraft = (): DraftAnswer => ({
  selectImage: null,
  choice: null,
  tokens: [],
})

const toUserAnswer = (exercise: Exercise, draft: DraftAnswer): UserAnswer => {
  if (exercise.type === 'select_image') {
    return {
      type: 'select_image',
      optionId: draft.selectImage ?? '',
    }
  }

  if (exercise.type === 'token_translate') {
    return {
      type: 'token_translate',
      sequence: draft.tokens,
    }
  }

  if (exercise.type === 'multiple_choice_translation') {
    return {
      type: 'multiple_choice_translation',
      choice: draft.choice ?? '',
    }
  }

  if (exercise.type === 'dialogue_choice') {
    return {
      type: 'dialogue_choice',
      choice: draft.choice ?? '',
    }
  }

  return {
    type: 'listening_tap',
    sequence: draft.tokens,
  }
}

const correctAnswerText = (exercise: Exercise): string => {
  if (exercise.type === 'select_image') {
    return exercise.options.find((option) => option.id === exercise.correctOptionId)?.label ?? exercise.correctOptionId
  }
  if (exercise.type === 'token_translate' || exercise.type === 'listening_tap') {
    return exercise.correctSequence.join(' ')
  }
  return exercise.correctChoice
}

const normalizeAudioLabel = (value: string): string =>
  value
    .trim()
    .replace(/[_-]/g, ' ')
    .replace(/[^\w\s']/g, '')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const extractNewWord = (exercise: Exercise): string | undefined => {
  if (!exercise.newWordBadge) {
    return undefined
  }

  if (exercise.type === 'select_image') {
    return exercise.prompt
  }

  if (exercise.promptSegments?.length) {
    const highlighted = exercise.promptSegments.find((segment) => segment.highlight === 'new-word')
    if (highlighted?.text?.trim()) {
      return highlighted.text.trim()
    }
  }

  if (exercise.type === 'multiple_choice_translation') {
    return exercise.prompt
  }

  return undefined
}

const getAudioLabel = (exercise: Exercise): string => {
  if (exercise.type === 'select_image') {
    return `🔊 ${normalizeAudioLabel(exercise.prompt)}`
  }

  if (exercise.audio?.mode === 'tts') {
    return `🔊 ${normalizeAudioLabel(exercise.audio.text)}`
  }

  return '🔊'
}

const computeSessionProgress = (queueState: LessonQueueState | null, totalExercises: number): number => {
  if (!queueState || totalExercises <= 0) {
    return 0
  }

  const reviewTotal = queueState.firstPassMistakes.length
  const reviewRemaining = queueState.reviewQueue.length
  const totalSteps = totalExercises + reviewTotal
  if (totalSteps <= 0) {
    return 0
  }

  if (queueState.phase === 'complete') {
    return 100
  }

  const mainCompleted = Math.min(queueState.mainIndex, totalExercises)
  if (queueState.phase === 'main') {
    return Math.round((mainCompleted / totalSteps) * 100)
  }

  const correctedReviewCount = Math.max(0, reviewTotal - reviewRemaining)
  return Math.round(((totalExercises + correctedReviewCount) / totalSteps) * 100)
}

export const LessonRunnerScreen = () => {
  const navigate = useNavigate()
  const params = useParams<{ lessonId: string }>()
  const lessonId = params.lessonId ?? 'unit1-lesson1'

  const lesson = useLessonSessionStore((state) => state.lesson)
  const queueState = useLessonSessionStore((state) => state.queueState)
  const feedback = useLessonSessionStore((state) => state.feedback)
  const combo = useLessonSessionStore((state) => state.combo)
  const attempts = useLessonSessionStore((state) => state.attempts)
  const needsMistakeIntro = useLessonSessionStore((state) => state.needsMistakeIntro)
  const restoreLesson = useLessonSessionStore((state) => state.restoreLesson)
  const submitAnswer = useLessonSessionStore((state) => state.submitAnswer)
  const continueAfterFeedback = useLessonSessionStore((state) => state.continueAfterFeedback)
  const toResumeState = useLessonSessionStore((state) => state.toResumeState)
  const lessonResume = useAppStore((state) => state.lessonResume)
  const saveLessonResume = useAppStore((state) => state.saveLessonResume)
  const completedLessons = useAppStore((state) => state.progress.completedLessons)
  const hasCompletedALesson = Object.keys(completedLessons).length > 0

  const currentExerciseId = queueState ? getCurrentExerciseId(queueState) : null
  const currentExercise = useMemo(
    () => lesson?.exercises.find((exercise) => exercise.id === currentExerciseId) ?? null,
    [lesson, currentExerciseId],
  )

  const [draftByExercise, setDraftByExercise] = useState<Record<string, DraftAnswer>>(() => {
    if (lessonResume?.lessonId === lessonId && !lesson) {
      return lessonResume.draftByExercise ?? {}
    }
    return {}
  })
  const [explanationExerciseId, setExplanationExerciseId] = useState<string | null>(null)
  const draft = currentExerciseId ? draftByExercise[currentExerciseId] ?? blankDraft() : blankDraft()
  const showExplanation = explanationExerciseId === currentExerciseId
  const currentAttemptCount = currentExerciseId ? (attempts[currentExerciseId] ?? 0) : 0
  const responseOrderAttempt = feedback ? Math.max(currentAttemptCount - 1, 0) : currentAttemptCount
  const renderedExercise = useMemo(() => {
    if (!currentExercise) {
      return null
    }
    return randomizeExerciseResponses(currentExercise, `${currentExercise.id}:attempt:${responseOrderAttempt}`)
  }, [currentExercise, responseOrderAttempt])

  const totalExercises = lesson?.exercises.length ?? 1
  const mainIndex = queueState?.mainIndex ?? 0
  const rawProgress = computeSessionProgress(queueState, totalExercises)
  const progress = queueState?.phase === 'main' && mainIndex === 0 ? Math.max(rawProgress, 8) : rawProgress

  useEffect(() => {
    if (lesson || !lessonResume || lessonResume.lessonId !== lessonId) {
      return
    }

    const lessonFromData = lessonById.get(lessonResume.lessonId)
    if (!lessonFromData) {
      return
    }

    restoreLesson(lessonFromData, lessonResume)
  }, [lesson, lessonResume, lessonId, restoreLesson])

  useEffect(() => {
    if (!currentExercise || feedback) {
      return
    }

    if (currentExercise.audio) {
      playAudioSpec(currentExercise.audio)
    }
  }, [currentExercise, feedback])

  useEffect(() => {
    if (!queueState || !lesson) {
      return
    }

    if (needsMistakeIntro) {
      navigate(`/lesson/${lesson.id}/mistakes`)
      return
    }

    if (queueState.phase === 'complete') {
      navigate(`/lesson/${lesson.id}/complete`)
    }
  }, [needsMistakeIntro, queueState, lesson, navigate])

  useEffect(() => {
    if (!lesson || !queueState) {
      return
    }
    saveLessonResume(toResumeState(draftByExercise))
  }, [lesson, queueState, toResumeState, saveLessonResume, draftByExercise])

  const isHydratingFromResume = !lesson && Boolean(lessonResume && lessonResume.lessonId === lessonId)
  // When phase is 'complete', currentExercise is null — the navigation effect is about to fire.
  // Render nothing so we never flash the "Sessão indisponível" screen before navigating away.
  const isTransitioningToComplete = Boolean(queueState?.phase === 'complete')

  if (!lesson || !queueState || !currentExercise || !renderedExercise) {
    if (isTransitioningToComplete) return null

    return (
      <ScreenScaffold
        title={isHydratingFromResume ? 'Retomando sessão...' : 'Sessão indisponível'}
        subtitle={isHydratingFromResume ? 'Carregando seu progresso salvo' : 'Inicie a lição novamente'}
        bottomSlot={<Button onClick={() => navigate(`/lesson/${lessonId}/intro`)}>Voltar</Button>}
      >
        <p className="text-sm font-bold text-ink/70">
          {isHydratingFromResume
            ? 'Estamos restaurando exatamente de onde você parou.'
            : 'Não foi possível carregar os exercícios desta sessão.'}
        </p>
      </ScreenScaffold>
    )
  }

  const onCheck = () => {
    const answer = toUserAnswer(currentExercise, draft)
    const result = submitAnswer(answer)
    if (!result) {
      return
    }

    if (result.isCorrect) {
      playSfx('correct')
      if (useLessonSessionStore.getState().combo.current >= 3) {
        playSfx('combo')
      }
      // Play answer audio after correct answer
      if (currentExercise.type === 'dialogue_choice') {
        if (currentExercise.answerAudio) {
          playAudioSpec(currentExercise.answerAudio)
        } else if (currentExercise.audio) {
          playAudioSpec(currentExercise.audio)
        }
      } else if (currentExercise.audio) {
        playAudioSpec(currentExercise.audio)
      }
    } else {
      playSfx('incorrect')
    }
  }

  const onContinue = () => {
    continueAfterFeedback()
  }

  const onReplayAudio = () => {
    playAudioSpec(currentExercise.audio)
  }

  const onSlowAudio = () => {
    if (currentExercise.audio?.mode === 'file') {
      if (currentExercise.slowAudio?.mode === 'file') {
        playAudioSpec(currentExercise.slowAudio, {
          fallbackAudioSpec: currentExercise.audio,
          fallbackPlaybackRate: 0.6,
        })
      } else {
        playAudioSpec(currentExercise.audio, { playbackRate: 0.6 })
      }
      return
    }

    if (currentExercise.slowAudio?.mode === 'tts') {
      playAudioSpec(currentExercise.slowAudio)
      return
    }

    if (currentExercise.audio?.mode === 'tts') {
      playAudioSpec({
        ...currentExercise.audio,
        rate: 0.65,
      })
      return
    }

    playAudioSpec(currentExercise.audio)
  }

  const addToken = (token: string) => {
    if (!currentExerciseId) {
      return
    }
    setDraftByExercise((state) => {
      const current = state[currentExerciseId] ?? blankDraft()
      return {
        ...state,
        [currentExerciseId]: { ...current, tokens: [...current.tokens, token] },
      }
    })
  }

  const removeToken = (index: number) => {
    if (!currentExerciseId) {
      return
    }
    setDraftByExercise((state) => {
      const current = state[currentExerciseId] ?? blankDraft()
      return {
        ...state,
        [currentExerciseId]: {
          ...current,
          tokens: current.tokens.filter((_, tokenIndex) => tokenIndex !== index),
        },
      }
    })
  }

  const evaluationPreview = feedback
    ? feedback.result
    : evaluateExercise(currentExercise, toUserAnswer(currentExercise, draft))
  const currentNewWord = extractNewWord(currentExercise)
  const audioLabel = getAudioLabel(currentExercise)
  const headerMeta = getExerciseHeaderMeta(currentExercise, currentNewWord)
  const listeningAccessory =
    currentExercise.type === 'listening_tap' ? (
      <div className="inline-flex w-fit border border-ink/10 bg-white shadow-[0_3px_0_rgba(27,43,38,0.08)]">
        {currentExercise.audio ? (
          <AudioButton
            onClick={onReplayAudio}
            iconOnly
            className="h-11 w-14 rounded-none border-0 border-r border-ink/10 px-0 py-0 text-xl shadow-none"
          />
        ) : null}
        <SlowAudioButton
          onClick={onSlowAudio}
          className="h-11 w-14 rounded-none border-0 px-0 py-0 text-xl shadow-none"
        />
      </div>
    ) : null

  return (
    <ScreenScaffold
      progress={progress}
      combo={combo.current}
      onExit={hasCompletedALesson ? () => navigate('/map') : undefined}
      title={currentExercise.instruction}
      bottomSlot={
        <div className="space-y-3">
          <AnimatePresence>
            {feedback ? (
              <FeedbackPanel
                  feedback={feedback.result}
                  correctAnswerLabel={correctAnswerText(currentExercise)}
                  message={
                    feedback.result.isCorrect
                      ? currentExercise.explanation?.correct
                      : currentExercise.explanation?.incorrect
                  }
                />
            ) : null}
          </AnimatePresence>

          {feedback ? (
            <div className="space-y-2">
              {currentExercise.explanation ? (
                <Button
                  variant="secondary"
                  onClick={() =>
                    setExplanationExerciseId((current) =>
                      current === currentExercise.id ? null : currentExercise.id,
                    )
                  }
                >
                  {feedback.result.isCorrect ? 'Explique minha resposta' : 'Explique meu erro'}
                </Button>
              ) : null}
              <Button onClick={onContinue}>Continuar</Button>
            </div>
          ) : (
            <Button disabled={!isAnswerReady(currentExercise, draft)} onClick={onCheck}>
              Verificar
            </Button>
          )}
        </div>
      }
    >
      <div className="space-y-3">
        <ComboBanner combo={combo.current} />

        <ExerciseHeader
          exercise={currentExercise}
          currentNewWord={currentNewWord}
          onReplayAudio={onReplayAudio}
          rightAccessory={listeningAccessory}
        />

        {!headerMeta.hasPromptBubble && !headerMeta.showSelectImageWordRow && currentExercise.type !== 'listening_tap' ? (
          <div className="flex gap-2">
            {currentExercise.audio ? <AudioButton onClick={onReplayAudio} label={audioLabel} /> : null}
          </div>
        ) : null}

        {currentExercise.type === 'select_image' ? (
          <SelectImageExercise
            exercise={renderedExercise.type === 'select_image' ? renderedExercise : currentExercise}
            selectedOptionId={draft.selectImage}
            onSelect={(optionId) => {
              if (!currentExerciseId) {
                return
              }
              setDraftByExercise((state) => {
                const current = state[currentExerciseId] ?? blankDraft()
                return {
                  ...state,
                  [currentExerciseId]: { ...current, selectImage: optionId },
                }
              })
            }}
          />
        ) : null}

        {currentExercise.type === 'token_translate' ? (
          <TokenTranslateExercise
            exercise={renderedExercise.type === 'token_translate' ? renderedExercise : currentExercise}
            selectedTokens={draft.tokens}
            onAddToken={(token) => addToken(token)}
            onRemoveToken={removeToken}
          />
        ) : null}

        {currentExercise.type === 'multiple_choice_translation' ? (
          <MultipleChoiceExercise
            exercise={renderedExercise.type === 'multiple_choice_translation' ? renderedExercise : currentExercise}
            selectedChoice={draft.choice}
            onSelect={(choice) => {
              if (!currentExerciseId) {
                return
              }
              setDraftByExercise((state) => {
                const current = state[currentExerciseId] ?? blankDraft()
                return {
                  ...state,
                  [currentExerciseId]: { ...current, choice },
                }
              })
            }}
          />
        ) : null}

        {currentExercise.type === 'dialogue_choice' ? (
          <DialogueChoiceExercise
            exercise={renderedExercise.type === 'dialogue_choice' ? renderedExercise : currentExercise}
            selectedChoice={draft.choice}
            omitFirstServerLine={Boolean(headerMeta.dialogueHeaderText)}
            onSelect={(choice) => {
              if (!currentExerciseId) {
                return
              }
              setDraftByExercise((state) => {
                const current = state[currentExerciseId] ?? blankDraft()
                return {
                  ...state,
                  [currentExerciseId]: { ...current, choice },
                }
              })
            }}
          />
        ) : null}

        {currentExercise.type === 'listening_tap' ? (
          <ListeningTapExercise
            exercise={renderedExercise.type === 'listening_tap' ? renderedExercise : currentExercise}
            selectedTokens={draft.tokens}
            onAddToken={(token) => addToken(token)}
            onRemoveToken={removeToken}
          />
        ) : null}
      </div>

      <AnimatePresence>
        {showExplanation && currentExercise.explanation ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-20 flex items-end bg-black/35"
            onClick={() => setExplanationExerciseId(null)}
          >
            <motion.div
              initial={{ y: 30 }}
              animate={{ y: 0 }}
              exit={{ y: 30 }}
              className="w-full rounded-t-3xl bg-white p-5"
              onClick={(event) => event.stopPropagation()}
            >
              <h3 className="font-display text-2xl text-ink">Explicação</h3>
              <p className="mt-2 text-sm font-semibold text-ink/80">
                {feedback?.result.isCorrect
                  ? currentExercise.explanation.correct
                  : currentExercise.explanation.incorrect}
              </p>
              {currentExercise.explanation.grammarNotes?.length ? (
                <ul className="mt-3 space-y-1">
                  {currentExercise.explanation.grammarNotes.map((item) => (
                    <li key={item.label} className="text-sm font-semibold text-ink/70">
                      <strong>{item.label}:</strong> {item.text}
                    </li>
                  ))}
                </ul>
              ) : null}
              <div className="mt-4">
                <Button variant="secondary" onClick={() => setExplanationExerciseId(null)}>
                  Fechar
                </Button>
              </div>
            </motion.div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      {!feedback && evaluationPreview.meaning ? (
        <p className="mt-4 text-xs font-bold text-ink/35">Dica de significado disponível após verificação.</p>
      ) : null}
    </ScreenScaffold>
  )
}
