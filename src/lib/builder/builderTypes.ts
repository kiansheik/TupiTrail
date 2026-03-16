// ─── Builder types ────────────────────────────────────────────────────────────
// Plain-string equivalents of the lesson engine types.
// No en() / pt() wrappers needed — every field is just a string.

export type CharacterId = 'bird' | 'woman' | 'man' | 'nonbinary' | 'bear'
export type CharacterMood = 'neutral' | 'happy' | 'encouraging' | 'thinking'
export type HighlightType = 'new-word' | 'normal'
export type ExerciseType =
  | 'select_image'
  | 'token_translate'
  | 'multiple_choice_translation'
  | 'dialogue_choice'
  | 'listening_tap'

export type BuilderAudio = {
  id: string
  mode: 'file' | 'recorded'
  /** Relative file path, used when mode === 'file' */
  src?: string
  /** IndexedDB key for the recorded blob */
  blobKey?: string
  /** MIME type of the recording (default: audio/webm) */
  mimeType?: string
}

export type BuilderGrammarNote = { label: string; text: string }

export type BuilderExplanation = {
  correct?: string
  incorrect?: string
  grammarNotes?: BuilderGrammarNote[]
}

export type BuilderSegment = {
  text: string
  highlight?: HighlightType
}

// ─── Common base ──────────────────────────────────────────────────────────────

export type BuilderExBase = {
  id: string
  type: ExerciseType
  instruction: string
  newWordBadge?: boolean
  characterId?: CharacterId
  characterMood?: CharacterMood
  audio?: BuilderAudio
  slowAudio?: BuilderAudio
  meaning?: string
  xp?: number
  explanation?: BuilderExplanation
}

// ─── Exercise variants ────────────────────────────────────────────────────────

export type BuilderSelectImageOption = {
  id: string
  label: string
  imageEmoji: string
  /** Key into IndexedDB imageStorage — set when an image is uploaded. */
  imageKey?: string
}

export type BuilderSelectImage = BuilderExBase & {
  type: 'select_image'
  prompt: string
  options: BuilderSelectImageOption[]
  correctOptionId: string
}

export type BuilderTokenTranslate = BuilderExBase & {
  type: 'token_translate'
  sourceText: BuilderSegment[]
  promptSegments?: BuilderSegment[]
  tokenBank: string[]
  correctSequence: string[]
}

export type BuilderMultipleChoice = BuilderExBase & {
  type: 'multiple_choice_translation'
  prompt: string
  promptSegments?: BuilderSegment[]
  choices: string[]
  correctChoice: string
}

export type BuilderDialogueLine = {
  speaker: string
  text?: string
  isBlank?: boolean
}

export type BuilderDialogueChoice = BuilderExBase & {
  type: 'dialogue_choice'
  dialogue: BuilderDialogueLine[]
  choices: string[]
  correctChoice: string
  answerAudio?: BuilderAudio
}

export type BuilderListeningTap = BuilderExBase & {
  type: 'listening_tap'
  tokenBank: string[]
  correctSequence: string[]
}

export type BuilderExercise =
  | BuilderSelectImage
  | BuilderTokenTranslate
  | BuilderMultipleChoice
  | BuilderDialogueChoice
  | BuilderListeningTap

// ─── Lesson ───────────────────────────────────────────────────────────────────

export type BuilderLesson = {
  /** Unique ID for builder storage (UUID) — distinct from lesson id */
  builderId: string
  id: string
  unitId: string
  title: string
  subtitle: string
  estimatedMinutes: number
  exercises: BuilderExercise[]
  createdAt: string
  updatedAt: string
}
