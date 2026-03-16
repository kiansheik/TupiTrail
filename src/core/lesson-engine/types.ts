export type RichTextHighlight = 'new-word' | 'normal'

export type RichTextSegment = {
  text: string
  highlight?: RichTextHighlight
}

export type AudioSpec =
  | { mode: 'tts'; text: string; lang: string; rate?: number }
  | {
      mode: 'file'
      src: string
      slowSrc?: string
      required?: boolean
      id?: string
    }

export type CharacterMood = 'neutral' | 'happy' | 'encouraging' | 'thinking'

export type CharacterRef = {
  id: 'bird' | 'woman' | 'man' | 'nonbinary' | 'bear'
  mood?: CharacterMood
}

export type ExerciseExplanation = {
  correct?: string
  incorrect?: string
  grammarNotes?: Array<{ label: string; text: string }>
}

export type BaseExercise = {
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
  promptSegments?: RichTextSegment[]
  audio?: AudioSpec
  slowAudio?: AudioSpec
  explanation?: ExerciseExplanation
  meaning?: string
  xp?: number
}

export type SelectImageOption = {
  id: string
  label: string
  imageEmoji: string
  /** Data URL or resolved file path. When present, rendered instead of imageEmoji. */
  imageSrc?: string
}

export type SelectImageExercise = BaseExercise & {
  type: 'select_image'
  prompt: string
  options: SelectImageOption[]
  correctOptionId: string
}

export type TokenTranslateExercise = BaseExercise & {
  type: 'token_translate'
  sourceText: RichTextSegment[]
  tokenBank: string[]
  correctSequence: string[]
}

export type MultipleChoiceTranslationExercise = BaseExercise & {
  type: 'multiple_choice_translation'
  prompt: string
  choices: string[]
  correctChoice: string
}

export type DialogueLine = {
  speaker: string
  text?: string
  isBlank?: boolean
}

export type DialogueChoiceExercise = BaseExercise & {
  type: 'dialogue_choice'
  dialogue: DialogueLine[]
  choices: string[]
  correctChoice: string
  answerAudio?: AudioSpec
}

export type ListeningTapExercise = BaseExercise & {
  type: 'listening_tap'
  tokenBank: string[]
  correctSequence: string[]
}

export type Exercise =
  | SelectImageExercise
  | TokenTranslateExercise
  | MultipleChoiceTranslationExercise
  | DialogueChoiceExercise
  | ListeningTapExercise

export type LessonData = {
  id: string
  unitId: string
  title: string
  subtitle: string
  estimatedMinutes: number
  exercises: Exercise[]
}

export type UnitData = {
  id: string
  title: string
  lessons: LessonData[]
}

export type CourseData = {
  id: string
  language: string
  units: UnitData[]
}

export type LessonMapNode = {
  id: string
  unitId: string
  lessonId: string
  x: number
  y: number
  type: 'lesson' | 'chest' | 'checkpoint'
  unlocked: boolean
  completed: boolean
}

export type SelectImageAnswer = {
  type: 'select_image'
  optionId: string
}

export type TokenSequenceAnswer = {
  type: 'token_translate' | 'listening_tap'
  sequence: string[]
}

export type ChoiceAnswer = {
  type: 'multiple_choice_translation' | 'dialogue_choice'
  choice: string
}

export type UserAnswer = SelectImageAnswer | TokenSequenceAnswer | ChoiceAnswer

export type EvaluationResult = {
  isCorrect: boolean
  correctAnswer: string | string[]
  explanation?: ExerciseExplanation
  meaning?: string
}

export type LessonResult = {
  lessonId: string
  accuracy: number
  xpEarned: number
  durationSec: number
  bestCombo: number
}
