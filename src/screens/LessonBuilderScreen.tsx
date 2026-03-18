import { motion } from 'framer-motion'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'

import { exportLessonZip } from '@/lib/builder/exportLesson'
import { importLessonZip } from '@/lib/builder/importLesson'
import {
  deleteBuilderLesson,
  duplicateBuilderLesson,
  listBuilderLessons,
  migrateImagesToIndexedDB,
  newEmptyLesson,
  saveBuilderLesson,
} from '@/lib/builder/builderStorage'
import type { BuilderLesson } from '@/lib/builder/builderTypes'

const TYPE_COLORS: Record<string, string> = {
  select_image: 'bg-yellow-100 text-yellow-700 border-yellow-300',
  token_translate: 'bg-blue-50 text-blue-700 border-blue-200',
  multiple_choice_translation: 'bg-purple-50 text-purple-700 border-purple-200',
  dialogue_choice: 'bg-green-50 text-green-700 border-green-200',
  listening_tap: 'bg-orange-50 text-orange-700 border-orange-200',
}

const TypePill = ({ type }: { type: string }) => (
  <span className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-wide ${TYPE_COLORS[type] ?? 'bg-shell text-ink/60 border-ink/15'}`}>
    {type.replace(/_/g, ' ')}
  </span>
)

const BuilderIcon = () => (
  <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden>
    <rect x="4" y="28" width="32" height="8" rx="3" fill="#2eb489" />
    <rect x="4" y="17" width="20" height="8" rx="3" fill="#ffd166" />
    <rect x="26" y="17" width="10" height="8" rx="3" fill="#ffd166" />
    <rect x="4" y="6" width="14" height="8" rx="3" fill="#06d6a0" />
    <rect x="20" y="6" width="16" height="8" rx="3" fill="#06d6a0" />
  </svg>
)

export const LessonBuilderScreen = () => {
  const navigate = useNavigate()
  const [lessons, setLessons] = useState<BuilderLesson[]>(() => listBuilderLessons())

  useEffect(() => { migrateImagesToIndexedDB() }, [])
  const [exporting, setExporting] = useState<string | null>(null)
  const [importing, setImporting] = useState(false)
  const [importError, setImportError] = useState<string | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)

  const refresh = () => setLessons(listBuilderLessons())

  const handleNew = () => {
    const lesson = newEmptyLesson()
    saveBuilderLesson(lesson)
    navigate(`/lessonbuilder/${lesson.builderId}`)
  }

  const handleDuplicate = (builderId: string) => {
    duplicateBuilderLesson(builderId)
    refresh()
  }

  const handleDelete = (builderId: string) => {
    if (confirmDelete === builderId) {
      deleteBuilderLesson(builderId)
      setConfirmDelete(null)
      refresh()
    } else {
      setConfirmDelete(builderId)
    }
  }

  const handleImportZip = async () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.zip'
    input.onchange = async () => {
      const file = input.files?.[0]
      if (!file) return
      setImporting(true)
      setImportError(null)
      try {
        const lesson = await importLessonZip(file)
        refresh()
        navigate(`/lessonbuilder/${lesson.builderId}`)
      } catch (err) {
        setImportError(err instanceof Error ? err.message : 'Erro ao importar ZIP')
      } finally {
        setImporting(false)
      }
    }
    input.click()
  }

  const handleExport = async (lesson: BuilderLesson) => {
    setExporting(lesson.builderId)
    try {
      await exportLessonZip(lesson)
    } finally {
      setExporting(null)
    }
  }

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col bg-shell">
      {/* Header */}
      <div className="border-b-2 border-ink/10 bg-white px-4 py-4">
        <div className="flex items-center gap-3">
          <BuilderIcon />
          <div>
            <h1 className="font-display text-2xl text-ink">Lesson Builder</h1>
            <p className="text-xs font-semibold text-ink/55">Crie e exporte lições para o Tupi Trail</p>
          </div>
        </div>
      </div>

      <main className="flex min-h-0 flex-1 flex-col overflow-y-auto px-4 py-4">
        {/* New / Import buttons */}
        <div className="mb-5 flex gap-3">
          <motion.button
            type="button"
            onClick={handleNew}
            whileTap={{ scale: 0.97 }}
            className="flex flex-1 items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 py-4 text-base font-black text-primary transition hover:bg-primary/10"
          >
            <span className="text-2xl leading-none">+</span> Nova Lição
          </motion.button>
          <motion.button
            type="button"
            onClick={handleImportZip}
            disabled={importing}
            whileTap={{ scale: 0.97 }}
            className="flex items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-accent/50 bg-accent/5 px-5 py-4 text-base font-black text-accent transition hover:bg-accent/10 disabled:opacity-50"
          >
            {importing ? '⏳' : '⬆'} Importar .zip
          </motion.button>
        </div>

        {importError && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-600">
            {importError}
          </div>
        )}

        {lessons.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 py-12 text-center">
            <span className="text-5xl">📝</span>
            <p className="text-base font-black text-ink/50">Nenhuma lição ainda.</p>
            <p className="text-sm font-semibold text-ink/35">Clique em "Nova Lição" para começar.</p>
          </div>
        )}

        <div className="space-y-3">
          {lessons.map((lesson, i) => {
            const typeCounts = lesson.exercises.reduce<Record<string, number>>((acc, ex) => {
              acc[ex.type] = (acc[ex.type] ?? 0) + 1
              return acc
            }, {})

            return (
              <motion.div
                key={lesson.builderId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="rounded-2xl border-2 border-ink/10 bg-white p-4"
              >
                {/* Title row */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="truncate font-display text-lg text-ink">{lesson.title || 'Sem título'}</p>
                    <p className="text-xs font-bold text-ink/45">
                      {lesson.id} · {lesson.unitId} · {lesson.exercises.length} exercício{lesson.exercises.length !== 1 ? 's' : ''}
                    </p>
                  </div>
                  <span className="shrink-0 rounded-full border border-ink/10 bg-shell px-2 py-0.5 text-[10px] font-black text-ink/40">
                    {new Date(lesson.updatedAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                {/* Type pills */}
                {Object.entries(typeCounts).length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1">
                    {Object.entries(typeCounts).map(([type, count]) => (
                      <span key={type} className="flex items-center gap-1">
                        <TypePill type={type} />
                        <span className="text-[10px] font-black text-ink/40">×{count}</span>
                      </span>
                    ))}
                  </div>
                )}

                {/* Actions */}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => navigate(`/lessonbuilder/${lesson.builderId}`)}
                    className="flex items-center gap-1 rounded-xl border border-primary/40 bg-primary/10 px-3 py-2 text-xs font-black text-primary transition hover:bg-primary/20"
                  >
                    ✏️ Editar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDuplicate(lesson.builderId)}
                    className="flex items-center gap-1 rounded-xl border border-ink/20 bg-shell px-3 py-2 text-xs font-black text-ink/70 transition hover:bg-ink/5"
                  >
                    ⧉ Duplicar
                  </button>
                  <button
                    type="button"
                    onClick={() => handleExport(lesson)}
                    disabled={exporting === lesson.builderId}
                    className="flex items-center gap-1 rounded-xl border border-success/40 bg-success/10 px-3 py-2 text-xs font-black text-success transition hover:bg-success/20 disabled:opacity-50"
                  >
                    {exporting === lesson.builderId ? '⏳ Exportando...' : '⬇ Exportar .zip'}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(lesson.builderId)}
                    className={`flex items-center gap-1 rounded-xl border px-3 py-2 text-xs font-black transition ${
                      confirmDelete === lesson.builderId
                        ? 'border-red-400 bg-red-500 text-white'
                        : 'border-red-200 bg-red-50 text-red-500 hover:bg-red-100'
                    }`}
                  >
                    {confirmDelete === lesson.builderId ? '⚠ Confirmar exclusão' : '🗑 Excluir'}
                  </button>
                </div>
              </motion.div>
            )
          })}
        </div>
      </main>
    </div>
  )
}
