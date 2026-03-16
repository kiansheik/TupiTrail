import type {
  BuilderLesson,
  BuilderExercise,
  BuilderExBase,
  BuilderSelectImage,
  BuilderTokenTranslate,
  BuilderMultipleChoice,
  BuilderDialogueChoice,
  BuilderListeningTap,
  BuilderAudio,
  BuilderSegment,
} from './builderTypes'
import { getAudioBlob } from './audioStorage'
import { getImageDataUrl } from './imageStorage'
import { buildZip, type ZipEntry } from './zipWriter'

const enc = new TextEncoder()

// ─── Code generation ──────────────────────────────────────────────────────────

function q(s: string): string {
  return `'${s.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
}

function audioRef(audio: BuilderAudio | undefined, lessonId: string): string {
  if (!audio) return 'undefined'
  if (audio.mode === 'file' && audio.src) {
    return `repoAudio(${q(audio.src)}, { id: ${q(audio.id)} })`
  }
  if (audio.mode === 'recorded' && audio.blobKey) {
    const ext = audio.mimeType?.includes('ogg') ? 'ogg' : 'webm'
    return `repoAudio(${q(`audio/${lessonId}/${audio.blobKey}.${ext}`)}, { id: ${q(audio.id)} })`
  }
  return 'undefined'
}

function segmentsCode(segs: BuilderSegment[]): string {
  return (
    '[\n' +
    segs
      .map((s) => {
        const hl = s.highlight ? `, highlight: ${q(s.highlight)}` : ''
        return `        { text: ${q(s.text)}${hl} }`
      })
      .join(',\n') +
    '\n      ]'
  )
}

function baseFields(ex: BuilderExBase, lessonId: string): string {
  const lines: string[] = []
  lines.push(`      id: ${q(ex.id)}`)
  lines.push(`      type: ${q(ex.type)}`)
  lines.push(`      instruction: ${q(ex.instruction)}`)
  if (ex.newWordBadge) lines.push(`      newWordBadge: true`)
  if (ex.characterId) {
    const mood = ex.characterMood ?? 'neutral'
    lines.push(`      character: { id: ${q(ex.characterId)}, mood: ${q(mood)} }`)
  }
  if (ex.audio) lines.push(`      audio: ${audioRef(ex.audio, lessonId)}`)
  if (ex.slowAudio) lines.push(`      slowAudio: ${audioRef(ex.slowAudio, lessonId)}`)
  if (ex.meaning !== undefined) lines.push(`      meaning: ${q(ex.meaning)}`)
  if (ex.xp !== undefined) lines.push(`      xp: ${ex.xp}`)
  if (ex.explanation) {
    const e = ex.explanation
    const inner: string[] = []
    if (e.correct) inner.push(`        correct: ${q(e.correct)}`)
    if (e.incorrect) inner.push(`        incorrect: ${q(e.incorrect)}`)
    if (e.grammarNotes?.length) {
      const notes = e.grammarNotes
        .map((n) => `          { label: ${q(n.label)}, text: ${q(n.text)} }`)
        .join(',\n')
      inner.push(`        grammarNotes: [\n${notes}\n        ]`)
    }
    lines.push(`      explanation: {\n${inner.join(',\n')}\n      }`)
  }
  return lines.join(',\n')
}

function exerciseCode(ex: BuilderExercise, lessonId: string): string {
  const base = baseFields(ex, lessonId)

  if (ex.type === 'select_image') {
    const e = ex as BuilderSelectImage
    const opts = e.options
      .map((o) => {
        const imgField = o.imageKey
          ? `, imageEmoji: ${q(o.imageEmoji ?? '')}, imageSrc: ${q(`/images/${lessonId}/${o.id}.jpg`)}`
          : `, imageEmoji: ${q(o.imageEmoji)}`
        return `        { id: ${q(o.id)}, label: ${q(o.label)}${imgField} }`
      })
      .join(',\n')
    return `    {\n${base},\n      prompt: ${q(e.prompt)},\n      options: [\n${opts}\n      ],\n      correctOptionId: ${q(e.correctOptionId)},\n    }`
  }

  if (ex.type === 'token_translate') {
    const e = ex as BuilderTokenTranslate
    const src = segmentsCode(e.sourceText)
    const bank = e.tokenBank.map((t) => q(t)).join(', ')
    const seq = e.correctSequence.map((t) => q(t)).join(', ')
    const prompt = e.promptSegments?.length
      ? `,\n      promptSegments: ${segmentsCode(e.promptSegments)}`
      : ''
    return `    {\n${base},\n      sourceText: ${src}${prompt},\n      tokenBank: [${bank}],\n      correctSequence: [${seq}],\n    }`
  }

  if (ex.type === 'multiple_choice_translation') {
    const e = ex as BuilderMultipleChoice
    const choices = e.choices.map((c) => q(c)).join(', ')
    const prompt = e.promptSegments?.length
      ? `,\n      promptSegments: ${segmentsCode(e.promptSegments)}`
      : ''
    return `    {\n${base},\n      prompt: ${q(e.prompt)}${prompt},\n      choices: [${choices}],\n      correctChoice: ${q(e.correctChoice)},\n    }`
  }

  if (ex.type === 'dialogue_choice') {
    const e = ex as BuilderDialogueChoice
    const dialogue = e.dialogue
      .map((l) => {
        if (l.isBlank) return `        { speaker: ${q(l.speaker)}, isBlank: true }`
        return `        { speaker: ${q(l.speaker)}, text: ${q(l.text ?? '')} }`
      })
      .join(',\n')
    const choices = e.choices.map((c) => q(c)).join(', ')
    const answerAudio = e.answerAudio
      ? `,\n      answerAudio: ${audioRef(e.answerAudio, lessonId)}`
      : ''
    return `    {\n${base},\n      dialogue: [\n${dialogue}\n      ],\n      choices: [${choices}],\n      correctChoice: ${q(e.correctChoice)}${answerAudio},\n    }`
  }

  // listening_tap
  const e = ex as BuilderListeningTap
  const bank = e.tokenBank.map((t) => q(t)).join(', ')
  const seq = e.correctSequence.map((t) => q(t)).join(', ')
  return `    {\n${base},\n      tokenBank: [${bank}],\n      correctSequence: [${seq}],\n    }`
}

function generateTs(lesson: BuilderLesson): string {
  const varName = lesson.id.replace(/[^a-zA-Z0-9]/g, '_') + '_template'
  const exercises = lesson.exercises.map((ex) => exerciseCode(ex, lesson.id)).join(',\n')

  return `import type { LessonTemplateData } from '@/core/lesson-engine/template-types'
import { repoAudio } from '@/data/audio/repoAudio'

// Generated by Tupi Trail Lesson Builder
// Lesson: ${lesson.title}
// Exported: ${new Date().toISOString()}

export const ${varName}: LessonTemplateData = {
  id: ${q(lesson.id)},
  unitId: ${q(lesson.unitId)},
  title: ${q(lesson.title)},
  subtitle: ${q(lesson.subtitle)},
  estimatedMinutes: ${lesson.estimatedMinutes},
  exercises: [
${exercises}
  ],
}
`
}

function generateReadme(lesson: BuilderLesson): string {
  return `# ${lesson.title}

Lição exportada pelo Tupi Trail Lesson Builder.

## Como integrar

1. Copie \`${lesson.id}.ts\` para \`src/data/course/en/unitX/\`
2. Copie a pasta \`audio/\` para \`public/audio/${lesson.id}/\`
3. Importe a lição em \`src/data/course/en/course.ts\` e adicione ao array de lições
4. Adicione o nó correspondente em \`pathNodesSeed\`

## Metadados

- **ID:** ${lesson.id}
- **Unit:** ${lesson.unitId}
- **Exercícios:** ${lesson.exercises.length}
- **Tempo estimado:** ${lesson.estimatedMinutes} min
- **Exportado em:** ${new Date().toLocaleString('pt-BR')}

## Áudio

Coloque os arquivos da pasta \`audio/\` em \`public/audio/${lesson.id}/\` antes de fazer o build.
`
}

// ─── Collect uploaded images from select_image options ────────────────────────

async function collectImageEntries(lesson: BuilderLesson): Promise<ZipEntry[]> {
  const entries: ZipEntry[] = []
  for (const ex of lesson.exercises) {
    if (ex.type !== 'select_image') continue
    for (const opt of (ex as BuilderSelectImage).options) {
      if (!opt.imageKey) continue
      const dataUrl = await getImageDataUrl(opt.imageKey)
      if (!dataUrl) continue
      const comma = dataUrl.indexOf(',')
      if (comma === -1) continue
      const b64 = dataUrl.slice(comma + 1)
      const binary = atob(b64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
      entries.push({ name: `images/${opt.id}.jpg`, data: bytes })
    }
  }
  return entries
}

// ─── Collect all audio blobs referenced in a lesson ───────────────────────────

async function collectAudioEntries(lesson: BuilderLesson): Promise<ZipEntry[]> {
  const entries: ZipEntry[] = []

  const process = async (audio: BuilderAudio | undefined) => {
    if (!audio || audio.mode !== 'recorded' || !audio.blobKey) return
    const blob = await getAudioBlob(audio.blobKey)
    if (!blob) return
    const ext = audio.mimeType?.includes('ogg') ? 'ogg' : 'webm'
    const arr = await blob.arrayBuffer()
    entries.push({ name: `audio/${audio.blobKey}.${ext}`, data: new Uint8Array(arr) })
  }

  for (const ex of lesson.exercises) {
    await process(ex.audio)
    await process(ex.slowAudio)
    if (ex.type === 'dialogue_choice') {
      await process((ex as BuilderDialogueChoice).answerAudio)
    }
  }

  return entries
}

// ─── Public export function ───────────────────────────────────────────────────

export async function exportLessonZip(lesson: BuilderLesson): Promise<void> {
  const tsCode = generateTs(lesson)
  const readme = generateReadme(lesson)

  const audioEntries = await collectAudioEntries(lesson)
  const imageEntries = await collectImageEntries(lesson)

  const zipEntries: ZipEntry[] = [
    { name: `${lesson.id}.ts`, data: enc.encode(tsCode) },
    { name: 'README.md', data: enc.encode(readme) },
    ...audioEntries,
    ...imageEntries,
  ]

  const zipBlob = buildZip(zipEntries)
  const url = URL.createObjectURL(zipBlob)
  const a = document.createElement('a')
  a.href = url
  a.download = `${lesson.id}.zip`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}
