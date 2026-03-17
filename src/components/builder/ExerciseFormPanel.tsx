import { useRef, useMemo, useState, useEffect } from 'react'
import { saveImageDataUrl, getImageDataUrl, deleteImageDataUrl } from '@/lib/builder/imageStorage'
import { createAudioUrl, getAudioBlob, saveAudioBlob } from '@/lib/builder/audioStorage'

// ─── Image resize utility ─────────────────────────────────────────────────────

function resizeImage(file: File, maxSize = 300): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const ratio = Math.min(maxSize / img.width, maxSize / img.height, 1)
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * ratio)
        canvas.height = Math.round(img.height * ratio)
        canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.82))
      }
      img.onerror = reject
      img.src = e.target?.result as string
    }
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

import { AudioRecorder } from './AudioRecorder'
import { CharacterPicker } from './CharacterPicker'
import { GrammarNotesEditor } from './GrammarNotesEditor'
import type {
  BuilderAudio,
  BuilderDialogueChoice,
  BuilderExercise,
  BuilderListeningTap,
  BuilderMultipleChoice,
  BuilderSelectImage,
  BuilderTokenTranslate,
  CharacterId,
  CharacterMood,
  HighlightType,
} from '@/lib/builder/builderTypes'

// ─── Shared field helpers ─────────────────────────────────────────────────────

const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) => {
  const { label, ...rest } = props
  return (
    <label className="block">
      <span className="text-xs font-bold text-ink/60">{label}</span>
      <input
        {...rest}
        className="mt-1 w-full rounded-lg border border-ink/20 bg-shell px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
      />
    </label>
  )
}

const Checkbox = ({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (v: boolean) => void
}) => (
  <label className="flex cursor-pointer items-center gap-2">
    <input
      type="checkbox"
      checked={checked}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 accent-primary"
    />
    <span className="text-sm font-bold text-ink/70">{label}</span>
  </label>
)

const SectionTitle = ({ children }: { children: React.ReactNode }) => (
  <p className="text-xs font-black uppercase tracking-wide text-ink/40">{children}</p>
)

// ─── Audio section ─────────────────────────────────────────────────────────────

function normalizeWordKey(word: string): string {
  return word
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
}

const AudioSection = ({
  exId,
  audio,
  showSlow,
  wordKey,
  onChange,
}: {
  exId: string
  audio?: BuilderAudio
  slowAudio?: BuilderAudio
  showSlow?: boolean
  wordKey?: string
  onChange: (field: 'audio' | 'slowAudio', val: BuilderAudio | undefined) => void
}) => {
  const wordBlobKey = wordKey ? `_word_${normalizeWordKey(wordKey)}` : undefined
  const [wordBlobExists, setWordBlobExists] = useState(false)

  useEffect(() => {
    if (!wordBlobKey) return
    let cancelled = false
    createAudioUrl(wordBlobKey).then((url) => {
      if (cancelled) return
      setWordBlobExists(!!url)
      if (url) URL.revokeObjectURL(url)
    })
    return () => { cancelled = true }
  }, [wordBlobKey])

  const usingWordAudio = !!wordBlobKey && audio?.blobKey === wordBlobKey

  const makeAudio = (blobKey: string): BuilderAudio => ({
    id: blobKey,
    mode: 'recorded',
    blobKey,
    mimeType: 'audio/webm',
  })

  const handleWordAudioToggle = (use: boolean) => {
    if (use && wordBlobKey) {
      onChange('audio', makeAudio(wordBlobKey))
    } else {
      onChange('audio', makeAudio(`${exId}-audio`))
    }
  }

  const handleSaveAsWordAudio = async () => {
    if (!wordBlobKey) return
    const blob = await getAudioBlob(`${exId}-audio`)
    if (!blob) return
    await saveAudioBlob(wordBlobKey, blob)
    setWordBlobExists(true)
    onChange('audio', makeAudio(wordBlobKey))
  }

  const hasExerciseAudio = !usingWordAudio && !!audio?.blobKey

  return (
    <div className="space-y-2">
      <SectionTitle>Áudio</SectionTitle>
      <div className="space-y-1.5">
        {wordBlobExists && wordBlobKey && (
          <div className="flex items-center gap-2 rounded-xl border border-primary/25 bg-primary/5 px-3 py-2">
            <Checkbox
              label={`Reusar áudio de "${wordKey}"`}
              checked={usingWordAudio}
              onChange={handleWordAudioToggle}
            />
          </div>
        )}
        {usingWordAudio ? (
          <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success/5 px-3 py-2">
            <span className="text-xs font-bold text-success">✓ usando áudio da palavra "{wordKey}"</span>
          </div>
        ) : (
          <>
            <AudioRecorder
              blobKey={`${exId}-audio`}
              label="Áudio principal"
              onSaved={() => onChange('audio', makeAudio(`${exId}-audio`))}
            />
            {wordKey && hasExerciseAudio && (
              <button
                type="button"
                onClick={handleSaveAsWordAudio}
                className="w-full rounded-xl border border-dashed border-primary/40 py-1.5 text-xs font-black text-primary/70 transition hover:border-primary hover:bg-primary/5 hover:text-primary"
              >
                Salvar como áudio de "{wordKey}"
              </button>
            )}
          </>
        )}
        {showSlow && (
          <AudioRecorder
            blobKey={`${exId}-slow`}
            label="Áudio lento (opcional)"
            onSaved={() => onChange('slowAudio', makeAudio(`${exId}-slow`))}
          />
        )}
      </div>
    </div>
  )
}

// ─── Segment editor (text + optional highlight) ────────────────────────────────

type Seg = { text: string; highlight?: HighlightType }

const SegmentListEditor = ({
  label,
  segments,
  onChange,
}: {
  label: string
  segments: Seg[]
  onChange: (segs: Seg[]) => void
}) => {
  const add = () => onChange([...segments, { text: '' }])
  const update = (i: number, field: keyof Seg, value: string) =>
    onChange(segments.map((s, idx) => (idx === i ? { ...s, [field]: value || undefined } : s)))
  const remove = (i: number) => onChange(segments.filter((_, idx) => idx !== i))

  return (
    <div>
      <span className="text-xs font-bold text-ink/60">{label}</span>
      <div className="mt-1 space-y-1.5">
        {segments.map((seg, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              className="min-w-0 flex-1 rounded-lg border border-ink/20 bg-shell px-2 py-1.5 text-sm font-semibold text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
              placeholder="texto do segmento"
              value={seg.text}
              onChange={(e) => update(i, 'text', e.target.value)}
            />
            <select
              className="rounded-lg border border-ink/20 bg-shell px-2 py-1.5 text-xs font-bold text-ink focus:border-primary focus:outline-none"
              value={seg.highlight ?? ''}
              onChange={(e) => update(i, 'highlight', e.target.value)}
            >
              <option value="">normal</option>
              <option value="new-word">novo-termo ★</option>
            </select>
            <button
              type="button"
              onClick={() => remove(i)}
              className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-black text-red-500 hover:bg-red-100"
            >
              ×
            </button>
          </div>
        ))}
        <button
          type="button"
          onClick={add}
          className="rounded-lg border border-dashed border-ink/25 bg-shell px-3 py-1 text-xs font-black text-ink/60 hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
        >
          + Segmento
        </button>
      </div>
    </div>
  )
}

// ─── Tag list editor with vocab suggestions ───────────────────────────────────

const TagListEditor = ({
  label,
  items,
  placeholder,
  vocab,
  onChange,
}: {
  label: string
  items: string[]
  placeholder?: string
  vocab?: string[]
  onChange: (items: string[]) => void
}) => {
  const [draft, setDraft] = useState('')

  const suggestions = useMemo(() => {
    if (!vocab?.length || !draft.trim()) return []
    const lower = draft.toLowerCase()
    return vocab
      .filter((v) => !items.includes(v) && v.toLowerCase().includes(lower))
      .slice(0, 8)
  }, [draft, vocab, items])

  const add = (value = draft) => {
    const trimmed = value.trim()
    if (!trimmed || items.includes(trimmed)) return
    onChange([...items, trimmed])
    setDraft('')
  }

  const remove = (i: number) => onChange(items.filter((_, idx) => idx !== i))

  return (
    <div>
      <span className="text-xs font-bold text-ink/60">{label}</span>
      <div className="mt-1 flex flex-wrap gap-1.5">
        {items.map((item, i) => (
          <span
            key={i}
            className="flex items-center gap-1 rounded-lg border border-ink/20 bg-shell px-2 py-1 text-xs font-black text-ink"
          >
            {item}
            <button type="button" onClick={() => remove(i)} className="text-red-400 hover:text-red-600">
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5">
        <input
          className="min-w-0 flex-1 rounded-lg border border-ink/20 bg-shell px-2 py-1.5 text-sm font-semibold text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
          placeholder={placeholder ?? 'nova entrada'}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
        />
        <button
          type="button"
          onClick={() => add()}
          className="rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-black text-primary hover:bg-primary/20"
        >
          +
        </button>
      </div>
      {suggestions.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {suggestions.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => add(s)}
              className="rounded-md border border-primary/30 bg-primary/8 px-2 py-0.5 text-xs font-bold text-primary/80 transition hover:bg-primary/20 hover:text-primary"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Common base fields (shared across all types) ─────────────────────────────

const BaseFields = ({
  ex,
  onChange,
}: {
  ex: BuilderExercise
  onChange: (partial: Partial<BuilderExercise>) => void
}) => (
  <div className="space-y-3">
    <Input
      label="Instrução"
      value={ex.instruction}
      placeholder="Ex: Selecione a imagem correta"
      onChange={(e) => onChange({ instruction: e.target.value } as Partial<BuilderExercise>)}
    />
    <Input
      label="Significado / tradução (opcional)"
      value={ex.meaning ?? ''}
      placeholder="Ex: café"
      onChange={(e) => onChange({ meaning: e.target.value || undefined } as Partial<BuilderExercise>)}
    />
    <label className="block">
      <span className="text-xs font-bold text-ink/60">XP</span>
      <input
        type="number"
        min={1}
        max={100}
        value={ex.xp ?? 8}
        onChange={(e) => onChange({ xp: Number(e.target.value) } as Partial<BuilderExercise>)}
        className="mt-1 w-20 rounded-lg border border-ink/20 bg-shell px-2 py-2 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
      />
    </label>
  </div>
)

// ─── Type-specific forms ───────────────────────────────────────────────────────

// ─── Per-option image cell ────────────────────────────────────────────────────

const OptionMediaCell = ({
  imageEmoji,
  imageKey,
  onEmojiChange,
  onImageUpload,
  onImageClear,
}: {
  imageEmoji: string
  imageKey?: string
  onEmojiChange: (v: string) => void
  onImageUpload: (key: string) => void
  onImageClear: () => void
}) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      const url = imageKey ? await getImageDataUrl(imageKey) : null
      if (!cancelled) setPreviewUrl(url)
    }
    load()
    return () => { cancelled = true }
  }, [imageKey])

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const dataUrl = await resizeImage(file)
    const key = crypto.randomUUID()
    await saveImageDataUrl(key, dataUrl)
    setPreviewUrl(dataUrl)
    onImageUpload(key)
    e.target.value = ''
  }

  const handleClear = async () => {
    if (imageKey) await deleteImageDataUrl(imageKey)
    setPreviewUrl(null)
    onImageClear()
  }

  return (
    <div className="flex shrink-0 flex-col items-center gap-1">
      <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-xl border-2 border-ink/15 bg-white">
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="" className="h-full w-full object-cover" draggable={false} />
            <button
              type="button"
              onClick={handleClear}
              className="absolute right-0.5 top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-black text-white shadow"
              title="Remover imagem"
            >
              ×
            </button>
          </>
        ) : (
          <input
            className="w-full bg-transparent text-center text-4xl leading-none focus:outline-none"
            placeholder="🍵"
            value={imageEmoji}
            onChange={(e) => onEmojiChange(e.target.value)}
            maxLength={2}
          />
        )}
      </div>
      {!previewUrl && (
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="rounded-md border border-ink/15 bg-shell px-1.5 py-0.5 text-[10px] font-black text-ink/50 hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          📷 foto
        </button>
      )}
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  )
}

const SelectImageForm = ({
  ex,
  onChange,
}: {
  ex: BuilderSelectImage
  onChange: (ex: BuilderSelectImage) => void
}) => {
  const updateOption = (i: number, patch: Partial<(typeof ex.options)[number]>) => {
    const options = ex.options.map((o, idx) => (idx === i ? { ...o, ...patch } : o))
    onChange({ ...ex, options })
  }
  const addOption = () =>
    onChange({ ...ex, options: [...ex.options, { id: '', label: '', imageEmoji: '' }] })
  const removeOption = (i: number) =>
    onChange({ ...ex, options: ex.options.filter((_, idx) => idx !== i) })

  return (
    <div className="space-y-4">
      <div className="flex items-end gap-3">
        <div className="flex-1">
          <Input
            label="Palavra / prompt"
            value={ex.prompt}
            placeholder="Ex: coffee"
            onChange={(e) => onChange({ ...ex, prompt: e.target.value })}
          />
        </div>
        <div className="mb-2">
          <Checkbox
            label="Novo termo"
            checked={!!ex.newWordBadge}
            onChange={(v) => onChange({ ...ex, newWordBadge: v })}
          />
        </div>
      </div>

      <div>
        <SectionTitle>Opções</SectionTitle>
        <div className="mt-2 space-y-2">
          {ex.options.map((opt, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-ink/15 bg-shell p-2">
              {/* Media cell: emoji or image */}
              <OptionMediaCell
                imageEmoji={opt.imageEmoji}
                imageKey={opt.imageKey}
                onEmojiChange={(v) => updateOption(i, { imageEmoji: v })}
                onImageUpload={(key) => updateOption(i, { imageKey: key })}
                onImageClear={() => updateOption(i, { imageKey: undefined })}
              />

              {/* Text fields */}
              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <input
                  className="w-full rounded-lg border border-ink/20 bg-white px-2 py-1.5 text-xs font-black text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
                  placeholder="id (ex: café)"
                  value={opt.id}
                  onChange={(e) => updateOption(i, { id: e.target.value })}
                />
                <input
                  className="w-full rounded-lg border border-ink/20 bg-white px-2 py-1.5 text-xs font-semibold text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
                  placeholder="rótulo exibido"
                  value={opt.label}
                  onChange={(e) => updateOption(i, { label: e.target.value })}
                />
              </div>

              <button
                type="button"
                onClick={() => removeOption(i)}
                className="shrink-0 self-start rounded-lg p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
              >
                ×
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addOption}
            className="w-full rounded-xl border border-dashed border-ink/25 py-2 text-xs font-black text-ink/50 hover:border-primary/60 hover:text-primary"
          >
            + Adicionar opção
          </button>
        </div>
      </div>

      <div>
        <span className="text-xs font-bold text-ink/60">Resposta correta</span>
        <select
          className="mt-1 w-full rounded-lg border border-ink/20 bg-shell px-3 py-2 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
          value={ex.correctOptionId}
          onChange={(e) => onChange({ ...ex, correctOptionId: e.target.value })}
        >
          <option value="">— selecione —</option>
          {ex.options.map((o) => (
            <option key={o.id} value={o.id}>
              {o.imageKey ? '🖼' : o.imageEmoji} {o.label || o.id}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
}

const TokenTranslateForm = ({
  ex,
  onChange,
  vocab,
}: {
  ex: BuilderTokenTranslate
  onChange: (ex: BuilderTokenTranslate) => void
  vocab?: string[]
}) => (
  <div className="space-y-4">
    <SegmentListEditor
      label="Texto fonte (o que o aluno lê)"
      segments={ex.sourceText}
      onChange={(segs) => onChange({ ...ex, sourceText: segs })}
    />
    <SegmentListEditor
      label="Segmentos do prompt — marque 'novo-termo' para exibir o badge"
      segments={ex.promptSegments ?? []}
      onChange={(segs) => {
        const hasNew = segs.some((s) => s.highlight === 'new-word')
        onChange({ ...ex, promptSegments: segs.length ? segs : undefined, newWordBadge: hasNew || undefined })
      }}
    />
    <TagListEditor
      label="Banco de tokens (todos os tokens disponíveis)"
      items={ex.tokenBank}
      placeholder="token"
      vocab={vocab}
      onChange={(items) => onChange({ ...ex, tokenBank: items })}
    />
    <TagListEditor
      label="Sequência correta (na ordem certa)"
      items={ex.correctSequence}
      placeholder="token correto"
      vocab={vocab}
      onChange={(items) => onChange({ ...ex, correctSequence: items })}
    />
  </div>
)

const MultipleChoiceForm = ({
  ex,
  onChange,
  vocab,
}: {
  ex: BuilderMultipleChoice
  onChange: (ex: BuilderMultipleChoice) => void
  vocab?: string[]
}) => (
  <div className="space-y-4">
    <Input label="Palavra / prompt" value={ex.prompt} placeholder="Ex: Welcome" onChange={(e) => onChange({ ...ex, prompt: e.target.value })} />
    <SegmentListEditor
      label="Segmentos do prompt — marque 'novo-termo' para exibir o badge"
      segments={ex.promptSegments ?? []}
      onChange={(segs) => {
        const hasNew = segs.some((s) => s.highlight === 'new-word')
        onChange({ ...ex, promptSegments: segs.length ? segs : undefined, newWordBadge: hasNew || undefined })
      }}
    />
    <TagListEditor
      label="Opções de escolha"
      items={ex.choices}
      placeholder="opção"
      vocab={vocab}
      onChange={(items) => onChange({ ...ex, choices: items })}
    />
    <div>
      <span className="text-xs font-bold text-ink/60">Resposta correta</span>
      <select
        className="mt-1 w-full rounded-lg border border-ink/20 bg-shell px-3 py-2 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
        value={ex.correctChoice}
        onChange={(e) => onChange({ ...ex, correctChoice: e.target.value })}
      >
        <option value="">— selecione —</option>
        {ex.choices.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
    </div>
  </div>
)

const DialogueChoiceForm = ({
  ex,
  onChange,
  vocab,
}: {
  ex: BuilderDialogueChoice
  onChange: (ex: BuilderDialogueChoice) => void
  vocab?: string[]
}) => {
  const addLine = (isBlank = false) =>
    onChange({
      ...ex,
      dialogue: [...ex.dialogue, isBlank ? { speaker: 'Você', isBlank: true } : { speaker: 'Garçom', text: '' }],
    })
  const updateLine = (i: number, field: string, value: string | boolean) =>
    onChange({ ...ex, dialogue: ex.dialogue.map((l, idx) => (idx === i ? { ...l, [field]: value } : l)) })
  const removeLine = (i: number) =>
    onChange({ ...ex, dialogue: ex.dialogue.filter((_, idx) => idx !== i) })

  return (
    <div className="space-y-4">
      <div>
        <SectionTitle>Linhas do diálogo</SectionTitle>
        <div className="mt-2 space-y-2">
          {ex.dialogue.map((line, i) => (
            <div key={i} className="flex items-center gap-2 rounded-xl border border-ink/15 bg-shell p-2">
              <input
                className="w-20 shrink-0 rounded-lg border border-ink/20 bg-white px-2 py-1.5 text-xs font-black text-ink focus:border-primary focus:outline-none"
                placeholder="falante"
                value={line.speaker}
                onChange={(e) => updateLine(i, 'speaker', e.target.value)}
              />
              {line.isBlank ? (
                <span className="flex-1 rounded-lg bg-accent/20 px-2 py-1.5 text-xs font-black text-ink/60">[resposta do aluno]</span>
              ) : (
                <input
                  className="min-w-0 flex-1 rounded-lg border border-ink/20 bg-white px-2 py-1.5 text-xs font-semibold text-ink focus:border-primary focus:outline-none"
                  placeholder="texto da fala"
                  value={line.text ?? ''}
                  onChange={(e) => updateLine(i, 'text', e.target.value)}
                />
              )}
              <button type="button" onClick={() => removeLine(i)} className="shrink-0 text-red-400 hover:text-red-600">
                ×
              </button>
            </div>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => addLine(false)}
              className="flex-1 rounded-xl border border-dashed border-ink/25 py-2 text-xs font-black text-ink/50 hover:border-primary/60 hover:text-primary"
            >
              + Fala
            </button>
            <button
              type="button"
              onClick={() => addLine(true)}
              className="flex-1 rounded-xl border border-dashed border-accent/60 py-2 text-xs font-black text-yellow-700 hover:border-accent hover:bg-yellow-50"
            >
              + Lacuna (resposta)
            </button>
          </div>
        </div>
      </div>

      <TagListEditor
        label="Opções de resposta"
        items={ex.choices}
        placeholder="opção"
        vocab={vocab}
        onChange={(items) => onChange({ ...ex, choices: items })}
      />
      <div>
        <span className="text-xs font-bold text-ink/60">Resposta correta</span>
        <select
          className="mt-1 w-full rounded-lg border border-ink/20 bg-shell px-3 py-2 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
          value={ex.correctChoice}
          onChange={(e) => onChange({ ...ex, correctChoice: e.target.value })}
        >
          <option value="">— selecione —</option>
          {ex.choices.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      <div>
        <SectionTitle>Áudio da resposta (opcional)</SectionTitle>
        <div className="mt-1.5">
          <AudioRecorder
            blobKey={`${ex.id}-answer`}
            label="Áudio da resposta"
            onSaved={() =>
              onChange({
                ...ex,
                answerAudio: { id: `${ex.id}-answer`, mode: 'recorded', blobKey: `${ex.id}-answer`, mimeType: 'audio/webm' },
              })
            }
          />
        </div>
      </div>
    </div>
  )
}

const ListeningTapForm = ({
  ex,
  onChange,
  vocab,
}: {
  ex: BuilderListeningTap
  onChange: (ex: BuilderListeningTap) => void
  vocab?: string[]
}) => (
  <div className="space-y-4">
    <TagListEditor
      label="Banco de tokens (inclui distractores)"
      items={ex.tokenBank}
      placeholder="token"
      vocab={vocab}
      onChange={(items) => onChange({ ...ex, tokenBank: items })}
    />
    <TagListEditor
      label="Sequência correta (o que o aluno deve ouvir e selecionar)"
      items={ex.correctSequence}
      placeholder="token correto"
      vocab={vocab}
      onChange={(items) => onChange({ ...ex, correctSequence: items })}
    />
  </div>
)


// ─── Main panel ───────────────────────────────────────────────────────────────

function getWordKey(ex: BuilderExercise): string | undefined {
  let word: string | undefined
  if (ex.type === 'select_image' || ex.type === 'multiple_choice_translation') {
    word = (ex as BuilderSelectImage | BuilderMultipleChoice).prompt
  } else if (ex.type === 'token_translate') {
    word = (ex as BuilderTokenTranslate).sourceText[0]?.text || ex.meaning
  } else if (ex.type === 'listening_tap') {
    word = (ex as BuilderListeningTap).correctSequence[0] || ex.meaning
  }
  return word?.trim() || ex.meaning?.trim()
}

type Props = {
  exercise: BuilderExercise
  onChange: (ex: BuilderExercise) => void
  vocab?: string[]
}

export const ExerciseFormPanel = ({ exercise: ex, onChange, vocab }: Props) => {
  const updateBase = (partial: Partial<BuilderExercise>) => onChange({ ...ex, ...partial } as BuilderExercise)

  const updateCharacter = (id: CharacterId | undefined, mood: CharacterMood) => {
    onChange({ ...ex, characterId: id, characterMood: mood } as BuilderExercise)
  }

  const updateAudioField = (field: 'audio' | 'slowAudio', val: BuilderAudio | undefined) => {
    onChange({ ...ex, [field]: val } as BuilderExercise)
  }

  const showSlowAudio = ex.type === 'select_image' || ex.type === 'listening_tap'

  return (
    <div className="space-y-5 rounded-2xl border-2 border-ink/10 bg-shell p-4">
      {/* Common base fields */}
      <BaseFields ex={ex} onChange={updateBase} />

      <hr className="border-ink/10" />

      {/* Type-specific fields */}
      {ex.type === 'select_image' && (
        <SelectImageForm ex={ex as BuilderSelectImage} onChange={(e) => onChange(e)} />
      )}
      {ex.type === 'token_translate' && (
        <TokenTranslateForm ex={ex as BuilderTokenTranslate} onChange={(e) => onChange(e)} vocab={vocab} />
      )}
      {ex.type === 'multiple_choice_translation' && (
        <MultipleChoiceForm ex={ex as BuilderMultipleChoice} onChange={(e) => onChange(e)} vocab={vocab} />
      )}
      {ex.type === 'dialogue_choice' && (
        <DialogueChoiceForm ex={ex as BuilderDialogueChoice} onChange={(e) => onChange(e)} vocab={vocab} />
      )}
      {ex.type === 'listening_tap' && (
        <ListeningTapForm ex={ex as BuilderListeningTap} onChange={(e) => onChange(e)} vocab={vocab} />
      )}

      <hr className="border-ink/10" />

      {/* Character picker */}
      <CharacterPicker
        characterId={ex.characterId}
        mood={ex.characterMood}
        onChange={updateCharacter}
      />

      {/* Audio (shared, except dialogue which handles its own answer audio) */}
      {ex.type !== 'dialogue_choice' && (
        <AudioSection
          exId={ex.id}
          audio={ex.audio}
          slowAudio={ex.slowAudio}
          showSlow={showSlowAudio}
          wordKey={getWordKey(ex)}
          onChange={updateAudioField}
        />
      )}
      {ex.type === 'dialogue_choice' && (
        <AudioSection
          exId={ex.id}
          audio={ex.audio}
          wordKey={getWordKey(ex)}
          onChange={updateAudioField}
        />
      )}

      {/* Grammar notes & feedback */}
      <GrammarNotesEditor
        explanation={ex.explanation}
        onChange={(e) => onChange({ ...ex, explanation: e } as BuilderExercise)}
      />
    </div>
  )
}
