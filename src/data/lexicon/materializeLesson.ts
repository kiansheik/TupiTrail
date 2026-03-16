import type {
  DialogueChoiceExercise,
  Exercise,
  LessonData,
  MultipleChoiceTranslationExercise,
  RichTextSegment,
  SelectImageExercise,
  TokenTranslateExercise,
  ListeningTapExercise,
} from '@/core/lesson-engine/types'
import type { ExerciseTemplate, LessonTemplateData } from '@/core/lesson-engine/template-types'
import { collectLocalizedEntries, resolveLocalizedText } from '@/data/lexicon/helpers'
import type { LexiconInventoryEntry } from '@/data/lexicon/helpers'
import type { LocalizedText } from '@/data/lexicon/types'

const resolveAudio = (
  audio: ExerciseTemplate['audio'] | undefined,
): Exercise['audio'] => {
  if (!audio) {
    return undefined
  }

  if (audio.mode === 'file') {
    return audio
  }

  return {
    ...audio,
    text: resolveLocalizedText(audio.text),
  }
}

const resolveSegments = (
  segments: Array<{ text: LocalizedText; highlight?: 'new-word' | 'normal' }> | undefined,
): RichTextSegment[] | undefined => {
  if (!segments) {
    return undefined
  }

  return segments.map((segment) => ({
    ...segment,
    text: resolveLocalizedText(segment.text),
  }))
}

const materializeExercise = (exercise: ExerciseTemplate): Exercise => {
  switch (exercise.type) {
    case 'select_image': {
      const resolved: SelectImageExercise = {
        ...exercise,
        prompt: resolveLocalizedText(exercise.prompt),
        options: exercise.options.map((option) => ({
          ...option,
          label: resolveLocalizedText(option.label),
        })),
        promptSegments: resolveSegments(exercise.promptSegments),
        audio: resolveAudio(exercise.audio),
        slowAudio: resolveAudio(exercise.slowAudio),
      }
      return resolved
    }

    case 'token_translate': {
      const resolved: TokenTranslateExercise = {
        ...exercise,
        sourceText: resolveSegments(exercise.sourceText) ?? [],
        tokenBank: exercise.tokenBank.map(resolveLocalizedText),
        correctSequence: exercise.correctSequence.map(resolveLocalizedText),
        promptSegments: resolveSegments(exercise.promptSegments),
        audio: resolveAudio(exercise.audio),
        slowAudio: resolveAudio(exercise.slowAudio),
      }
      return resolved
    }

    case 'multiple_choice_translation': {
      const resolved: MultipleChoiceTranslationExercise = {
        ...exercise,
        prompt: resolveLocalizedText(exercise.prompt),
        choices: exercise.choices.map(resolveLocalizedText),
        correctChoice: resolveLocalizedText(exercise.correctChoice),
        promptSegments: resolveSegments(exercise.promptSegments),
        audio: resolveAudio(exercise.audio),
        slowAudio: resolveAudio(exercise.slowAudio),
      }
      return resolved
    }

    case 'dialogue_choice': {
      const resolved: DialogueChoiceExercise = {
        ...exercise,
        dialogue: exercise.dialogue.map((line) => ({
          ...line,
          text: line.text ? resolveLocalizedText(line.text) : undefined,
        })),
        choices: exercise.choices.map(resolveLocalizedText),
        correctChoice: resolveLocalizedText(exercise.correctChoice),
        promptSegments: resolveSegments(exercise.promptSegments),
        audio: resolveAudio(exercise.audio),
        slowAudio: resolveAudio(exercise.slowAudio),
        answerAudio: resolveAudio(exercise.answerAudio),
      }
      return resolved
    }

    case 'listening_tap': {
      const resolved: ListeningTapExercise = {
        ...exercise,
        tokenBank: exercise.tokenBank.map(resolveLocalizedText),
        correctSequence: exercise.correctSequence.map(resolveLocalizedText),
        promptSegments: resolveSegments(exercise.promptSegments),
        audio: resolveAudio(exercise.audio),
        slowAudio: resolveAudio(exercise.slowAudio),
      }
      return resolved
    }

    default: {
      const unreachable: never = exercise
      throw new Error(`Unsupported exercise template: ${JSON.stringify(unreachable)}`)
    }
  }
}

export const materializeLesson = (lesson: LessonTemplateData): LessonData => ({
  ...lesson,
  exercises: lesson.exercises.map(materializeExercise),
})

const collectTextsFromExercise = (exercise: ExerciseTemplate): LocalizedText[] => {
  const list: LocalizedText[] = []

  const pushIfPresent = (item?: LocalizedText): void => {
    if (item) {
      list.push(item)
    }
  }

  exercise.promptSegments?.forEach((segment) => pushIfPresent(segment.text))

  if (exercise.audio?.mode === 'tts') {
    list.push(exercise.audio.text)
  }
  if (exercise.slowAudio?.mode === 'tts') {
    list.push(exercise.slowAudio.text)
  }

  switch (exercise.type) {
    case 'select_image':
      list.push(exercise.prompt)
      exercise.options.forEach((option) => list.push(option.label))
      break
    case 'token_translate':
      exercise.sourceText.forEach((segment) => list.push(segment.text))
      exercise.tokenBank.forEach((token) => list.push(token))
      exercise.correctSequence.forEach((token) => list.push(token))
      break
    case 'multiple_choice_translation':
      list.push(exercise.prompt)
      exercise.choices.forEach((choice) => list.push(choice))
      list.push(exercise.correctChoice)
      break
    case 'dialogue_choice':
      exercise.dialogue.forEach((line) => pushIfPresent(line.text))
      exercise.choices.forEach((choice) => list.push(choice))
      list.push(exercise.correctChoice)
      break
    case 'listening_tap':
      exercise.tokenBank.forEach((token) => list.push(token))
      exercise.correctSequence.forEach((token) => list.push(token))
      break
    default:
      break
  }

  return list
}

export const extractLessonLexiconInventory = (lesson: LessonTemplateData): LexiconInventoryEntry[] => {
  const all = lesson.exercises.flatMap((exercise) => collectTextsFromExercise(exercise))
  return collectLocalizedEntries(all)
}
