import type {
  CharacterRef,
  ExerciseExplanation,
  LessonData,
  SelectImageOption,
} from '@/core/lesson-engine/types'
import type { LocalizedText } from '@/data/lexicon/types'

export type LocalizedRichTextSegment = {
  text: LocalizedText
  highlight?: 'new-word' | 'normal'
}

export type LessonAudioSpec =
  | { mode: 'tts'; text: LocalizedText; lang: string; rate?: number }
  | { mode: 'file'; src: string; slowSrc?: string }

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
  prompt: LocalizedText
  options: Array<Omit<SelectImageOption, 'label'> & { label: LocalizedText }>
  correctOptionId: string
}

export type TokenTranslateExerciseTemplate = TemplateBaseExercise & {
  type: 'token_translate'
  sourceText: LocalizedRichTextSegment[]
  tokenBank: LocalizedText[]
  correctSequence: LocalizedText[]
}

export type MultipleChoiceTranslationExerciseTemplate = TemplateBaseExercise & {
  type: 'multiple_choice_translation'
  prompt: LocalizedText
  choices: LocalizedText[]
  correctChoice: LocalizedText
}

export type DialogueChoiceExerciseTemplate = TemplateBaseExercise & {
  type: 'dialogue_choice'
  dialogue: Array<{
    speaker: string
    text?: LocalizedText
    isBlank?: boolean
  }>
  choices: LocalizedText[]
  correctChoice: LocalizedText
}

export type ListeningTapExerciseTemplate = TemplateBaseExercise & {
  type: 'listening_tap'
  tokenBank: LocalizedText[]
  correctSequence: LocalizedText[]
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
