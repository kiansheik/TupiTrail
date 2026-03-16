import type { BuilderExplanation, BuilderGrammarNote } from '@/lib/builder/builderTypes'

type Props = {
  explanation?: BuilderExplanation
  onChange: (e: BuilderExplanation) => void
}

const empty = (): BuilderExplanation => ({})

export const GrammarNotesEditor = ({ explanation, onChange }: Props) => {
  const ex = explanation ?? empty()

  const updateField = (field: 'correct' | 'incorrect', value: string) => {
    onChange({ ...ex, [field]: value || undefined })
  }

  const addNote = () => {
    const notes = [...(ex.grammarNotes ?? []), { label: '', text: '' }]
    onChange({ ...ex, grammarNotes: notes })
  }

  const updateNote = (i: number, field: keyof BuilderGrammarNote, value: string) => {
    const notes = (ex.grammarNotes ?? []).map((n, idx) => (idx === i ? { ...n, [field]: value } : n))
    onChange({ ...ex, grammarNotes: notes })
  }

  const removeNote = (i: number) => {
    const notes = (ex.grammarNotes ?? []).filter((_, idx) => idx !== i)
    onChange({ ...ex, grammarNotes: notes.length ? notes : undefined })
  }

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
        <div className="space-y-2">
          {(ex.grammarNotes ?? []).map((note, i) => (
            <div key={i} className="flex items-start gap-2">
              <input
                className="w-24 shrink-0 rounded-lg border border-ink/20 bg-shell px-2 py-1.5 text-xs font-black text-ink placeholder:text-ink/35 focus:border-primary focus:outline-none"
                placeholder="morfema"
                value={note.label}
                onChange={(e) => updateNote(i, 'label', e.target.value)}
              />
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
          ))}
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
