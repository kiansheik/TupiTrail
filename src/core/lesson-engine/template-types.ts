import type {
  CharacterRef,
  ExerciseExplanation,
  LessonData,
  SelectImageOption,
} from '@/core/lesson-engine/types'
import type { LocalizedText } from '@/data/lexicon/types'

export type TextInput = string | LocalizedText

export type LocalizedRichTextSegment = {
  text: TextInput
  highlight?: 'new-word' | 'normal'
}

export type LessonAudioSpec =
  | { mode: 'tts'; text: LocalizedText; lang: string; rate?: number }
  | {
      mode: 'file'
      src: string
      slowSrc?: string
      required?: boolean
      id?: string
    }

type TemplateBaseExercise = {
  id: string
  type:
    | 'select_image'
    | 'token_translate'
    | 'multiple_choice_translation'
    | 'dialogue_choice'
    | 'listening_tap'
  instruction: string
  newWordBadge?: boolean
  character?: CharacterRef
  promptSegments?: LocalizedRichTextSegment[]
  audio?: LessonAudioSpec
  slowAudio?: LessonAudioSpec
  explanation?: ExerciseExplanation
  meaning?: string
  xp?: number
}

export type SelectImageExerciseTemplate = TemplateBaseExercise & {
  type: 'select_image'
  prompt: TextInput
  options: Array<Omit<SelectImageOption, 'label'> & { label: TextInput }>
  correctOptionId: string
}

export type TokenTranslateExerciseTemplate = TemplateBaseExercise & {
  type: 'token_translate'
  sourceText: LocalizedRichTextSegment[]
  tokenBank: TextInput[]
  correctSequence: TextInput[]
}

export type MultipleChoiceTranslationExerciseTemplate = TemplateBaseExercise & {
  type: 'multiple_choice_translation'
  prompt: TextInput
  choices: TextInput[]
  correctChoice: TextInput
}

export type DialogueChoiceExerciseTemplate = TemplateBaseExercise & {
  type: 'dialogue_choice'
  dialogue: Array<{
    speaker: string
    text?: TextInput
    isBlank?: boolean
  }>
  choices: TextInput[]
  correctChoice: TextInput
  answerAudio?: LessonAudioSpec
}

export type ListeningTapExerciseTemplate = TemplateBaseExercise & {
  type: 'listening_tap'
  tokenBank: TextInput[]
  correctSequence: TextInput[]
}

export type ExerciseTemplate =
  | SelectImageExerciseTemplate
  | TokenTranslateExerciseTemplate
  | MultipleChoiceTranslationExerciseTemplate
  | DialogueChoiceExerciseTemplate
  | ListeningTapExerciseTemplate

export type LessonTemplateData = Omit<LessonData, 'exercises'> & {
  exercises: ExerciseTemplate[]
}
