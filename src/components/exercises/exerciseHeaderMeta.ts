import type { Exercise } from '@/core/lesson-engine/types'

export type ExerciseHeaderMeta = {
  hasPromptBubble: boolean
  isTokenTranslatePrompt: boolean
  showSelectImageWordRow: boolean
  dialogueHeaderText: string | null
  multipleChoicePromptText: string | null
}

export const getExerciseHeaderMeta = (
  exercise: Exercise,
  currentNewWord?: string,
): ExerciseHeaderMeta => {
  const hasPromptBubble = Boolean(exercise.promptSegments?.length)
  const isTokenTranslatePrompt = exercise.type === 'token_translate' && hasPromptBubble
  const showSelectImageWordRow =
    exercise.type === 'select_image' && Boolean(exercise.newWordBadge) && Boolean(currentNewWord)
  const multipleChoicePromptText =
    exercise.type === 'multiple_choice_translation' && !hasPromptBubble ? exercise.prompt : null
  const dialogueHeaderText =
    exercise.type === 'dialogue_choice'
      ? exercise.dialogue.find(
          (line) => ['server', 'garçom', 'garcom', 'atendente'].includes(line.speaker.trim().toLowerCase()) && !line.isBlank && Boolean(line.text),
        )?.text ?? null
      : null

  return {
    hasPromptBubble,
    isTokenTranslatePrompt,
    showSelectImageWordRow,
    dialogueHeaderText,
    multipleChoicePromptText,
  }
}
