import { useRef, useState, useCallback, useEffect, useMemo } from 'react'

import type { BuilderExplanation, BuilderGrammarNote } from '@/lib/builder/builderTypes'
import { cn } from '@/lib/utils/classNames'

type GrammarNoteEntry = { label: string; text: string }

type Props = {
  explanation?: BuilderExplanation
  onChange: (e: BuilderExplanation) => void
  knownNotes?: GrammarNoteEntry[]
}

const empty = (): BuilderExplanation => ({})

/** How long the user must hold the handle before drag activates (ms). */
const LONG_PRESS_MS = 200

export const GrammarNotesEditor = ({ explanation, onChange, knownNotes }: Props) => {
  const ex = useMemo(() => explanation ?? empty(), [explanation])
  const notes = useMemo(() => ex.grammarNotes ?? [], [ex.grammarNotes])

  // ─── Drag state ──────────────────────────────────────────────────────────
  const [dragIndex, setDragIndex] = useState<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)
  const [armed, setArmed] = useState<number | null>(null)
  const dragItemRef = useRef<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  // ─── Autocomplete state ──────────────────────────────────────────────────
  const [focusedLabelIdx, setFocusedLabelIdx] = useState<number | null>(null)
  const [highlightedSuggestion, setHighlightedSuggestion] = useState(0)
  const suggestionsRef = useRef<HTMLDivElement>(null)

  useEffect(() => () => { if (longPressTimer.current) clearTimeout(longPressTimer.current) }, [])

  const updateField = (field: 'correct' | 'incorrect', value: string) => {
    onChange({ ...ex, [field]: value || undefined })
  }

  const addNote = () => {
    onChange({ ...ex, grammarNotes: [...notes, { label: '', text: '' }] })
  }

  const updateNote = (i: number, field: keyof BuilderGrammarNote, value: string) => {
    const updated = notes.map((n, idx) => (idx === i ? { ...n, [field]: value } : n))
    onChange({ ...ex, grammarNotes: updated })
  }

  const removeNote = (i: number) => {
    const updated = notes.filter((_, idx) => idx !== i)
    onChange({ ...ex, grammarNotes: updated.length ? updated : undefined })
  }

  const applyNoteSuggestion = (i: number, suggestion: GrammarNoteEntry) => {
    const updated = notes.map((n, idx) =>
      idx === i ? { ...n, label: suggestion.label, text: suggestion.text } : n,
    )
    onChange({ ...ex, grammarNotes: updated })
    setFocusedLabelIdx(null)
  }

  const moveNote = useCallback(
    (from: number, to: number) => {
      if (from === to) return
      const updated = [...notes]
      const [moved] = updated.splice(from, 1)
      updated.splice(to, 0, moved)
      onChange({ ...ex, grammarNotes: updated })
    },
    [notes, ex, onChange],
  )

  // ─── Autocomplete suggestions ────────────────────────────────────────────

  const suggestions = useMemo(() => {
    if (focusedLabelIdx === null || !knownNotes?.length) return []
    const draft = notes[focusedLabelIdx]?.label?.trim().toLowerCase() ?? ''
    if (!draft) return []
    const existingLabels = new Set(notes.map((n) => n.label.toLowerCase()))
    return knownNotes
      .filter((n) => n.label.includes(draft) && !existingLabels.has(n.label))
      .slice(0, 6)
  }, [focusedLabelIdx, knownNotes, notes])

  const handleLabelKeyDown = (e: React.KeyboardEvent, i: number) => {
    if (!suggestions.length) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedSuggestion((h) => Math.min(h + 1, suggestions.length - 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedSuggestion((h) => Math.max(h - 1, 0))
    } else if (e.key === 'Enter' && suggestions[highlightedSuggestion]) {
      e.preventDefault()
      applyNoteSuggestion(i, suggestions[highlightedSuggestion])
    } else if (e.key === 'Escape') {
      setFocusedLabelIdx(null)
    }
  }

  // ─── Drag handlers ───────────────────────────────────────────────────────

  const activateDrag = (index: number) => {
    dragItemRef.current = index
    setDragIndex(index)
    setOverIndex(index)
    setArmed(null)
  }

  const cancelArm = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current)
      longPressTimer.current = null
    }
    setArmed(null)
  }

  const finishDrag = () => {
    if (dragItemRef.current !== null && overIndex !== null) {
      moveNote(dragItemRef.current, overIndex)
    }
    dragItemRef.current = null
    setDragIndex(null)
    setOverIndex(null)
    cancelArm()
  }

  const handleGripPointerDown = (index: number) => {
    setArmed(index)
    longPressTimer.current = setTimeout(() => {
      activateDrag(index)
    }, LONG_PRESS_MS)
  }

  const handleGripPointerUp = () => {
    if (dragItemRef.current === null) cancelArm()
  }

  const handleDragStart = (e: React.DragEvent, index: number) => {
    if (dragItemRef.current !== index) {
      e.preventDefault()
      return
    }
  }

  const handleDragEnter = (index: number) => {
    if (dragItemRef.current === null) return
    setOverIndex(index)
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragItemRef.current === null || !containerRef.current) return
    const touch = e.touches[0]
    const noteEls = containerRef.current.querySelectorAll('[data-note-index]')
    for (const el of noteEls) {
      const rect = el.getBoundingClientRect()
      if (touch.clientY >= rect.top && touch.clientY <= rect.bottom) {
        const idx = Number(el.getAttribute('data-note-index'))
        setOverIndex(idx)
        break
      }
    }
  }

  const isDragging = dragIndex !== null

  return (
    <div className="space-y-3 rounded-xl border border-ink/15 bg-white p-3">
      <p className="text-xs font-black uppercase tracking-wide text-ink/50">Feedback e notas</p>

      <label className="block">
        <span className="text-xs font-bold text-ink/60">Mensagem de acerto (opcional)</span>
        <input
          className="mt-1 w-full rounded-lg border border-ink/20 bg-shell px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
          placeholder="Ex: Perfeito! Resposta correta."
          value={ex.correct ?? ''}
          onChange={(e) => updateField('correct', e.target.value)}
        />
      </label>

      <label className="block">
        <span className="text-xs font-bold text-ink/60">Mensagem de erro (opcional)</span>
        <input
          className="mt-1 w-full rounded-lg border border-ink/20 bg-shell px-3 py-2 text-sm font-semibold text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
          placeholder="Ex: Tente novamente."
          value={ex.incorrect ?? ''}
          onChange={(e) => updateField('incorrect', e.target.value)}
        />
      </label>

      {/* Grammar notes */}
      <div>
        <p className="mb-2 text-xs font-bold text-ink/60">Notas gramaticais</p>
        <div
          ref={containerRef}
          className="space-y-2"
          onTouchMove={handleTouchMove}
          onTouchEnd={finishDrag}
        >
          {notes.map((note, i) => {
            const isBeingDragged = dragIndex === i
            const isDropTarget = isDragging && overIndex === i && dragIndex !== i
            const isArming = armed === i && !isDragging
            const showSuggestions = focusedLabelIdx === i && suggestions.length > 0

            return (
              <div
                key={i}
                data-note-index={i}
                draggable={isDragging && dragIndex === i}
                onDragStart={(e) => handleDragStart(e, i)}
                onDragEnter={() => handleDragEnter(i)}
                onDragOver={(e) => { if (isDragging) e.preventDefault() }}
                onDragEnd={finishDrag}
                className={cn(
                  'flex items-start gap-2 rounded-lg transition-all duration-150',
                  isDropTarget && 'ring-2 ring-primary/40 ring-offset-1',
                  isBeingDragged && 'scale-[1.02] opacity-50 shadow-lg',
                  isArming && 'scale-[1.01] shadow-md',
                )}
              >
                {/* Drag handle */}
                <div
                  className={cn(
                    'mt-1 shrink-0 cursor-grab touch-none select-none rounded px-1 py-0.5 text-sm transition-colors',
                    isBeingDragged || isArming
                      ? 'bg-primary/15 text-primary'
                      : 'text-ink/25 hover:bg-ink/5 hover:text-ink/50',
                  )}
                  onPointerDown={() => handleGripPointerDown(i)}
                  onPointerUp={handleGripPointerUp}
                  onPointerLeave={handleGripPointerUp}
                  onTouchStart={() => handleGripPointerDown(i)}
                  role="button"
                  tabIndex={-1}
                  aria-label="Segurar para reordenar"
                >
                  ⠿
                </div>

                {/* Label input with autocomplete */}
                <div className="relative w-24 shrink-0">
                  <input
                    className="w-full rounded-lg border border-ink/20 bg-shell px-2 py-1.5 text-xs font-black text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
                    placeholder="morfema"
                    value={note.label}
                    onChange={(e) => {
                      updateNote(i, 'label', e.target.value)
                      setHighlightedSuggestion(0)
                    }}
                    onFocus={() => {
                      setFocusedLabelIdx(i)
                      setHighlightedSuggestion(0)
                    }}
                    onBlur={() => setTimeout(() => setFocusedLabelIdx(null), 150)}
                    onKeyDown={(e) => handleLabelKeyDown(e, i)}
                  />
                  {showSuggestions && (
                    <div
                      ref={suggestionsRef}
                      className="absolute left-0 top-full z-20 mt-1 w-56 overflow-hidden rounded-lg border border-ink/15 bg-white shadow-lg"
                    >
                      {suggestions.map((s, si) => (
                        <button
                          key={s.label}
                          type="button"
                          onMouseDown={(e) => {
                            e.preventDefault()
                            applyNoteSuggestion(i, s)
                          }}
                          className={cn(
                            'flex w-full items-baseline gap-2 px-3 py-1.5 text-left text-xs transition',
                            si === highlightedSuggestion
                              ? 'bg-primary/10 text-ink'
                              : 'text-ink/70 hover:bg-shell',
                          )}
                        >
                          <span className="shrink-0 font-black">{s.label}</span>
                          <span className="truncate font-semibold text-ink/40">{s.text}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                <input
                  className="min-w-0 flex-1 rounded-lg border border-ink/20 bg-shell px-2 py-1.5 text-xs font-semibold text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
                  placeholder="significado / função"
                  value={note.text}
                  onChange={(e) => updateNote(i, 'text', e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => removeNote(i)}
                  className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-2 py-1.5 text-xs font-black text-red-500 hover:bg-red-100"
                >
                  ×
                </button>
              </div>
            )
          })}
        </div>
        <button
          type="button"
          onClick={addNote}
          className="mt-2 rounded-lg border border-dashed border-ink/25 bg-shell px-3 py-1.5 text-xs font-black text-ink/60 hover:border-primary/60 hover:bg-primary/5 hover:text-primary"
        >
          + Adicionar nota
        </button>
      </div>
    </div>
  )
}
