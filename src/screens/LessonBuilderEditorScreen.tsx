import { motion, AnimatePresence } from 'framer-motion'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { ExerciseFormPanel } from '@/components/builder/ExerciseFormPanel'
import { EXERCISE_TYPE_LABELS } from '@/components/builder/exerciseTypeLabels'
import { LessonPreview } from '@/components/builder/LessonPreview'
import { exportLessonZip } from '@/lib/builder/exportLesson'
import { getBuilderLesson, listBuilderLessons, saveBuilderLesson, titleToLessonId } from '@/lib/builder/builderStorage'
import type { BuilderExercise, BuilderLesson, ExerciseType } from '@/lib/builder/builderTypes'
import { collectBuilderVocab, collectBuilderGrammarNotes, collectEngineVocab, collectEngineGrammarNotes, mergeVocab, mergeGrammarNotes } from '@/lib/builder/vocabCollector'
import { lessonById } from '@/data/course'

// ─── New exercise factory ─────────────────────────────────────────────────────

const DEFAULT_INSTRUCTIONS: Record<ExerciseType, string> = {
  select_image: 'Selecione a imagem correta',
  token_translate: 'Traduza esta frase',
  multiple_choice_translation: 'Escolha a tradução correta',
  dialogue_choice: 'Complete o diálogo',
  listening_tap: 'Toque no que escutar',
}

function makeExercise(type: ExerciseType, existingCount: number): BuilderExercise {
  const id = `ex${existingCount + 1}`
  const base = { id, type, instruction: DEFAULT_INSTRUCTIONS[type], xp: 8 }

  if (type === 'select_image') {
    return { ...base, type, prompt: '', options: [], correctOptionId: '' }
  }
  if (type === 'token_translate') {
    return { ...base, type, sourceText: [], tokenBank: [], correctSequence: [] }
  }
  if (type === 'multiple_choice_translation') {
    return { ...base, type, prompt: '', choices: [], correctChoice: '' }
  }
  if (type === 'dialogue_choice') {
    return { ...base, type, dialogue: [], choices: [], correctChoice: '' }
  }
  // listening_tap
  return { ...base, type, tokenBank: [], correctSequence: [] }
}

// ─── Type selector modal ──────────────────────────────────────────────────────

const TYPE_DESCRIPTIONS: Record<ExerciseType, string> = {
  select_image: 'O aluno vê uma palavra e escolhe a imagem correta',
  token_translate: 'O aluno monta uma frase arrastando tokens',
  multiple_choice_translation: 'O aluno escolhe a tradução correta entre 3 opções',
  dialogue_choice: 'O aluno completa uma lacuna num diálogo',
  listening_tap: 'O aluno ouve um áudio e seleciona o token certo',
}

const TYPE_ICONS: Record<ExerciseType, string> = {
  select_image: '🖼',
  token_translate: '🔤',
  multiple_choice_translation: '✅',
  dialogue_choice: '💬',
  listening_tap: '🎧',
}

const TypeSelectorModal = ({
  onSelect,
  onClose,
}: {
  onSelect: (type: ExerciseType) => void
  onClose: () => void
}) => {
  const TYPES: ExerciseType[] = [
    'select_image',
    'token_translate',
    'multiple_choice_translation',
    'dialogue_choice',
    'listening_tap',
  ]

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-ink/40 px-4 pb-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ y: 80, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        exit={{ y: 80, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 28 }}
        className="w-full max-w-sm rounded-3xl border-2 border-ink/10 bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <p className="mb-3 font-display text-lg text-ink">Tipo de exercício</p>
        <div className="space-y-2">
          {TYPES.map((type) => (
            <button
              key={type}
              type="button"
              onClick={() => onSelect(type)}
              className="flex w-full items-center gap-3 rounded-2xl border border-ink/10 bg-shell px-3 py-3 text-left transition hover:border-primary/40 hover:bg-primary/5"
            >
              <span className="text-2xl">{TYPE_ICONS[type]}</span>
              <div>
                <p className="text-sm font-black text-ink">{EXERCISE_TYPE_LABELS[type]}</p>
                <p className="text-xs font-semibold text-ink/50">{TYPE_DESCRIPTIONS[type]}</p>
              </div>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-2xl border border-ink/15 py-2 text-sm font-black text-ink/50 hover:bg-shell"
        >
          Cancelar
        </button>
      </motion.div>
    </div>
  )
}

// ─── Exercise row (collapsed summary) ─────────────────────────────────────────

const TYPE_COLOR_MAP: Record<string, string> = {
  select_image: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  token_translate: 'bg-blue-50 text-blue-700 border-blue-200',
  multiple_choice_translation: 'bg-purple-50 text-purple-700 border-purple-200',
  dialogue_choice: 'bg-green-50 text-green-700 border-green-200',
  listening_tap: 'bg-orange-50 text-orange-700 border-orange-200',
}

const ExerciseRow = ({
  ex,
  index,
  total,
  expanded,
  onToggle,
  onChange,
  onMove,
  onDelete,
  vocab,
  grammarNotes,
}: {
  ex: BuilderExercise
  index: number
  total: number
  expanded: boolean
  onToggle: () => void
  onChange: (ex: BuilderExercise) => void
  onMove: (dir: -1 | 1) => void
  onDelete: () => void
  vocab?: string[]
  grammarNotes?: Array<{ label: string; text: string }>
}) => {
  return (
    <div className="rounded-2xl border-2 border-ink/10 bg-white">
      {/* Header row — entire row toggles except action buttons */}
      <div
        role="button"
        tabIndex={0}
        onClick={onToggle}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onToggle() } }}
        className="flex cursor-pointer items-center gap-2 px-3 py-2.5"
      >
        {/* Order badge */}
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-black text-primary">
          {index + 1}
        </span>

        {/* Type pill */}
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${TYPE_COLOR_MAP[ex.type] ?? 'bg-shell text-ink/60 border-ink/15'}`}
        >
          {TYPE_ICONS[ex.type as ExerciseType] ?? '📝'} {ex.type.replace(/_/g, ' ')}
        </span>

        {/* Summary text */}
        <div className="min-w-0 flex-1 text-left">
          <p className="truncate text-sm font-bold text-ink">
            {ex.instruction || <span className="text-ink/35">sem instrução</span>}
          </p>
          <p className="truncate text-xs font-semibold text-ink/40">{ex.id}</p>
        </div>

        {/* Move up/down */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMove(-1) }}
          disabled={index === 0}
          className="shrink-0 rounded-lg px-1.5 py-1 text-xs font-black text-ink/40 transition hover:bg-shell hover:text-ink disabled:opacity-20"
        >
          ↑
        </button>
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onMove(1) }}
          disabled={index === total - 1}
          className="shrink-0 rounded-lg px-1.5 py-1 text-xs font-black text-ink/40 transition hover:bg-shell hover:text-ink disabled:opacity-20"
        >
          ↓
        </button>

        {/* Delete */}
        <button
          type="button"
          onClick={(e) => { e.stopPropagation(); onDelete() }}
          className="shrink-0 rounded-lg px-2 py-1 text-xs font-black text-red-400 transition hover:bg-red-50 hover:text-red-600"
        >
          ×
        </button>

        {/* Expand toggle indicator */}
        <span className="shrink-0 px-1.5 py-1 text-xs font-black text-ink/40">
          {expanded ? '▲' : '▼'}
        </span>
      </div>

      {/* Expanded form */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border-t border-ink/10 px-3 py-3">
              <ExerciseFormPanel exercise={ex} onChange={onChange} vocab={vocab} grammarNotes={grammarNotes} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ─── Main editor screen ───────────────────────────────────────────────────────

export const LessonBuilderEditorScreen = () => {
  const navigate = useNavigate()
  const { builderId } = useParams<{ builderId: string }>()

  const [lesson, setLesson] = useState<BuilderLesson | null>(null)
  const [idIsAuto, setIdIsAuto] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showTypeModal, setShowTypeModal] = useState(false)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [exporting, setExporting] = useState(false)
  const [previewing, setPreviewing] = useState(false)
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Vocab pool: current lesson + all other builder lessons + lesson1 seed
  const [seedVocab] = useState<string[]>(() => {
    const otherExercises = listBuilderLessons()
      .filter((l) => l.builderId !== builderId)
      .flatMap((l) => l.exercises)
    const lesson1 = lessonById.get('unit1-lesson1')
    return mergeVocab(
      collectBuilderVocab(otherExercises),
      collectEngineVocab(lesson1?.exercises ?? []),
    )
  })

  const vocab = useMemo(
    () => mergeVocab(collectBuilderVocab(lesson?.exercises ?? []), new Set(seedVocab)),
    [lesson?.exercises, seedVocab],
  )

  // Grammar notes pool: all notes from all builder lessons + engine lessons
  const [seedGrammarNotes] = useState(() => {
    const otherExercises = listBuilderLessons()
      .filter((l) => l.builderId !== builderId)
      .flatMap((l) => l.exercises)
    const lesson1 = lessonById.get('unit1-lesson1')
    return mergeGrammarNotes(
      collectBuilderGrammarNotes(otherExercises),
      collectEngineGrammarNotes(lesson1?.exercises ?? []),
    )
  })

  const grammarNotes = useMemo(
    () => mergeGrammarNotes(collectBuilderGrammarNotes(lesson?.exercises ?? []), seedGrammarNotes),
    [lesson?.exercises, seedGrammarNotes],
  )

  useEffect(() => {
    if (!builderId) return
    const found = getBuilderLesson(builderId)
    if (found) {
      setLesson(found)
      setIdIsAuto(found.id === titleToLessonId(found.unitId, found.title))
    } else {
      navigate('/lessonbuilder')
    }
  }, [builderId, navigate])

  // Auto-save debounced
  const scheduleSave = useCallback(
    (updated: BuilderLesson) => {
      setSaveStatus('unsaved')
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
      saveTimerRef.current = setTimeout(() => {
        setSaveStatus('saving')
        saveBuilderLesson(updated)
        setSaveStatus('saved')
      }, 800)
    },
    [],
  )

  const update = useCallback(
    (patch: Partial<BuilderLesson>) => {
      setLesson((prev) => {
        if (!prev) return prev
        const updated = { ...prev, ...patch }
        scheduleSave(updated)
        return updated
      })
    },
    [scheduleSave],
  )

  const updateMeta = (field: keyof BuilderLesson, value: string | number) => {
    update({ [field]: value } as Partial<BuilderLesson>)
  }

  const handleTitleChange = (newTitle: string) => {
    if (!lesson) return
    if (idIsAuto) {
      update({ title: newTitle, id: titleToLessonId(lesson.unitId, newTitle) })
    } else {
      update({ title: newTitle })
    }
  }

  const handleUnitIdChange = (newUnitId: string) => {
    if (!lesson) return
    if (idIsAuto) {
      update({ unitId: newUnitId, id: titleToLessonId(newUnitId, lesson.title) })
    } else {
      update({ unitId: newUnitId })
    }
  }

  const handleIdChange = (newId: string) => {
    if (!lesson) return
    const autoId = titleToLessonId(lesson.unitId, lesson.title)
    setIdIsAuto(newId === autoId)
    update({ id: newId })
  }

  const addExercise = (type: ExerciseType) => {
    setShowTypeModal(false)
    if (!lesson) return
    const ex = makeExercise(type, lesson.exercises.length)
    const exercises = [...lesson.exercises, ex]
    setExpandedId(ex.id)
    update({ exercises })
  }

  const updateExercise = (i: number, ex: BuilderExercise) => {
    if (!lesson) return
    const exercises = lesson.exercises.map((e, idx) => (idx === i ? ex : e))
    update({ exercises })
  }

  const moveExercise = (i: number, dir: -1 | 1) => {
    if (!lesson) return
    const exercises = [...lesson.exercises]
    const j = i + dir
    if (j < 0 || j >= exercises.length) return
    ;[exercises[i], exercises[j]] = [exercises[j], exercises[i]]
    update({ exercises })
  }

  const deleteExercise = (i: number) => {
    if (!lesson) return
    const exercises = lesson.exercises.filter((_, idx) => idx !== i)
    if (expandedId === lesson.exercises[i].id) setExpandedId(null)
    update({ exercises })
  }

  const handleExport = async () => {
    if (!lesson) return
    setExporting(true)
    try {
      await exportLessonZip(lesson)
    } finally {
      setExporting(false)
    }
  }

  if (!lesson) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-sm font-bold text-ink/50">Carregando…</p>
      </div>
    )
  }

  const SAVE_LABELS = { saved: '✓ Salvo', saving: '⏳ Salvando…', unsaved: '● Editando…' }
  const SAVE_COLORS = { saved: 'text-success', saving: 'text-ink/50', unsaved: 'text-accent' }

  return (
    <>
      <div className="flex h-full min-h-0 flex-1 flex-col bg-shell">
        {/* Top bar */}
        <div className="border-b-2 border-ink/10 bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => navigate('/lessonbuilder')}
              className="shrink-0 rounded-xl border border-ink/15 bg-shell px-3 py-1.5 text-xs font-black text-ink/60 hover:bg-ink/5"
            >
              ← Voltar
            </button>
            <div className="min-w-0 flex-1">
              <p className="truncate font-display text-base text-ink">{lesson.title || 'Nova Lição'}</p>
              <p className={`text-xs font-bold ${SAVE_COLORS[saveStatus]}`}>{SAVE_LABELS[saveStatus]}</p>
            </div>
            <button
              type="button"
              onClick={() => setPreviewing(true)}
              disabled={lesson.exercises.length === 0}
              className="shrink-0 rounded-xl border border-ink/20 bg-shell px-3 py-1.5 text-xs font-black text-ink/70 transition hover:bg-ink/5 disabled:opacity-30"
            >
              👁 Preview
            </button>
            <button
              type="button"
              onClick={handleExport}
              disabled={exporting}
              className="shrink-0 rounded-xl border border-success/40 bg-success/10 px-3 py-1.5 text-xs font-black text-success hover:bg-success/20 disabled:opacity-50"
            >
              {exporting ? '⏳' : '⬇'} Exportar
            </button>
          </div>
        </div>

        <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
          {/* ─── Lesson metadata ─── */}
          <section className="mb-5 rounded-2xl border-2 border-ink/10 bg-white p-4">
            <p className="mb-3 text-xs font-black uppercase tracking-wide text-ink/40">Metadados da lição</p>
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <label className="block">
                  <span className="text-xs font-bold text-ink/60">
                    ID da lição{idIsAuto && <span className="ml-1 text-primary/60">• auto</span>}
                  </span>
                  <input
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-shell px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
                    value={lesson.id}
                    placeholder="unit1-lesson2"
                    onChange={(e) => handleIdChange(e.target.value)}
                  />
                </label>
                <label className="block">
                  <span className="text-xs font-bold text-ink/60">Unit ID</span>
                  <input
                    className="mt-1 w-full rounded-lg border border-ink/20 bg-shell px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
                    value={lesson.unitId}
                    placeholder="unit1"
                    onChange={(e) => handleUnitIdChange(e.target.value)}
                  />
                </label>
              </div>
              <label className="block">
                <span className="text-xs font-bold text-ink/60">Título</span>
                <input
                  className="mt-1 w-full rounded-lg border border-ink/20 bg-shell px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
                  value={lesson.title}
                  placeholder="Ex: Drinks & Polite Words"
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-ink/60">Subtítulo</span>
                <input
                  className="mt-1 w-full rounded-lg border border-ink/20 bg-shell px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
                  value={lesson.subtitle}
                  placeholder="Ex: Primeiros blocos de conversa"
                  onChange={(e) => updateMeta('subtitle', e.target.value)}
                />
              </label>
              <label className="block">
                <span className="text-xs font-bold text-ink/60">Tempo estimado (minutos)</span>
                <input
                  type="number"
                  min={1}
                  max={60}
                  className="mt-1 w-24 rounded-lg border border-ink/20 bg-shell px-3 py-2 text-sm font-semibold text-ink focus:border-primary focus:outline-none"
                  value={lesson.estimatedMinutes}
                  onChange={(e) => updateMeta('estimatedMinutes', Number(e.target.value))}
                />
              </label>
            </div>
          </section>

          {/* ─── Exercise list ─── */}
          <div className="mb-3 flex items-center justify-between">
            <p className="text-xs font-black uppercase tracking-wide text-ink/40">
              Exercícios ({lesson.exercises.length})
            </p>
          </div>

          <div className="space-y-2">
            {lesson.exercises.map((ex, i) => (
              <ExerciseRow
                key={ex.id}
                ex={ex}
                index={i}
                total={lesson.exercises.length}
                expanded={expandedId === ex.id}
                onToggle={() => setExpandedId(expandedId === ex.id ? null : ex.id)}
                onChange={(updated) => updateExercise(i, updated)}
                onMove={(dir) => moveExercise(i, dir)}
                onDelete={() => deleteExercise(i)}
                vocab={vocab}
                grammarNotes={grammarNotes}
              />
            ))}
          </div>

          {/* Add exercise button */}
          <button
            type="button"
            onClick={() => setShowTypeModal(true)}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/40 py-3 text-sm font-black text-primary transition hover:bg-primary/5"
          >
            <span className="text-xl leading-none">+</span> Adicionar exercício
          </button>

          {lesson.exercises.length === 0 && (
            <p className="mt-4 text-center text-xs font-semibold text-ink/40">
              Nenhum exercício ainda. Clique em "Adicionar exercício" para começar.
            </p>
          )}

          {/* Bottom padding */}
          <div className="h-8" />
        </main>
      </div>

      {/* Type selector modal */}
      <AnimatePresence>
        {showTypeModal && (
          <TypeSelectorModal
            onSelect={addExercise}
            onClose={() => setShowTypeModal(false)}
          />
        )}
      </AnimatePresence>

      {/* Lesson preview overlay */}
      <AnimatePresence>
        {previewing && lesson && (
          <LessonPreview
            builderExercises={lesson.exercises}
            onClose={() => setPreviewing(false)}
          />
        )}
      </AnimatePresence>
    </>
  )
}
