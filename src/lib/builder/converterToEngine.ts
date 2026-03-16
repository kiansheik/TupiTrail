import type { AudioSpec, Exercise, RichTextSegment } from '@/core/lesson-engine/types'
import { createAudioUrl } from './audioStorage'
import type {
  BuilderAudio,
  BuilderDialogueChoice,
  BuilderExercise,
  BuilderListeningTap,
  BuilderMultipleChoice,
  BuilderSelectImage,
  BuilderSegment,
  BuilderTokenTranslate,
} from './builderTypes'

// ─── Audio ────────────────────────────────────────────────────────────────────

function convertAudio(audio: BuilderAudio | undefined, urls: Map<string, string>): AudioSpec | undefined {
  if (!audio) return undefined
  if (audio.mode === 'file' && audio.src) {
    return { mode: 'file', src: audio.src, id: audio.id }
  }
  if (audio.mode === 'recorded' && audio.blobKey) {
    const url = urls.get(audio.blobKey)
    if (url) return { mode: 'file', src: url, id: audio.id }
  }
  return undefined
}

// ─── Segments ─────────────────────────────────────────────────────────────────

function segs(s: BuilderSegment[] | undefined): RichTextSegment[] | undefined {
  return s?.length ? (s as RichTextSegment[]) : undefined
}

// ─── Exercise ─────────────────────────────────────────────────────────────────

function convertExercise(ex: BuilderExercise, urls: Map<string, string>): Exercise {
  const base = {
    id: ex.id,
    instruction: ex.instruction,
    newWordBadge: ex.newWordBadge,
    character: ex.characterId ? { id: ex.characterId, mood: ex.characterMood ?? 'neutral' } : undefined,
    promptSegments: segs((ex as BuilderTokenTranslate).promptSegments ?? (ex as BuilderMultipleChoice).promptSegments),
    audio: convertAudio(ex.audio, urls),
    slowAudio: convertAudio(ex.slowAudio, urls),
    explanation: ex.explanation,
    meaning: ex.meaning,
    xp: ex.xp,
  } as const

  if (ex.type === 'select_image') {
    const e = ex as BuilderSelectImage
    return {
      ...base,
      type: 'select_image',
      prompt: e.prompt,
      options: e.options.map((o) => ({
        id: o.id,
        label: o.label,
        imageEmoji: o.imageEmoji,
      })),
      correctOptionId: e.correctOptionId,
    }
  }

  if (ex.type === 'token_translate') {
    const e = ex as BuilderTokenTranslate
    return {
      ...base,
      type: 'token_translate',
      sourceText: e.sourceText as RichTextSegment[],
      promptSegments: segs(e.promptSegments),
      tokenBank: e.tokenBank,
      correctSequence: e.correctSequence,
    }
  }

  if (ex.type === 'multiple_choice_translation') {
    const e = ex as BuilderMultipleChoice
    return {
      ...base,
      type: 'multiple_choice_translation',
      prompt: e.prompt,
      promptSegments: segs(e.promptSegments),
      choices: e.choices,
      correctChoice: e.correctChoice,
    }
  }

  if (ex.type === 'dialogue_choice') {
    const e = ex as BuilderDialogueChoice
    return {
      ...base,
      type: 'dialogue_choice',
      dialogue: e.dialogue,
      choices: e.choices,
      correctChoice: e.correctChoice,
      answerAudio: convertAudio(e.answerAudio, urls),
    }
  }

  // listening_tap
  const e = ex as BuilderListeningTap
  return { ...base, type: 'listening_tap', tokenBank: e.tokenBank, correctSequence: e.correctSequence }
}

// ─── Collect all audio blob keys from a lesson ────────────────────────────────

function collectBlobKeys(exercises: BuilderExercise[]): string[] {
  const keys: string[] = []
  for (const ex of exercises) {
    for (const a of [ex.audio, ex.slowAudio]) {
      if (a?.mode === 'recorded' && a.blobKey) keys.push(a.blobKey)
    }
    if (ex.type === 'dialogue_choice') {
      const a = (ex as BuilderDialogueChoice).answerAudio
      if (a?.mode === 'recorded' && a.blobKey) keys.push(a.blobKey)
    }
  }
  return keys
}

// ─── Public API ───────────────────────────────────────────────────────────────

/** Load all recorded audio blobs into object URLs, then convert exercises to engine format. */
export async function builderToEngineExercises(
  exercises: BuilderExercise[],
): Promise<{ engineExercises: Exercise[]; revokeAll: () => void }> {
  const blobKeys = collectBlobKeys(exercises)

  const entries = await Promise.all(
    blobKeys.map(async (key): Promise<[string, string] | null> => {
      const url = await createAudioUrl(key)
      return url ? [key, url] : null
    }),
  )

  const urls = new Map<string, string>(entries.filter((e): e is [string, string] => e !== null))

  const engineExercises = exercises.map((ex) => convertExercise(ex, urls))

  const revokeAll = () => urls.forEach((url) => URL.revokeObjectURL(url))

  return { engineExercises, revokeAll }
}
