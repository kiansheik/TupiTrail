import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
import type { CharacterId, CharacterMood } from '@/lib/builder/builderTypes'

const CHARACTERS: CharacterId[] = ['bird', 'woman', 'man', 'nonbinary', 'bear']
const MOODS: CharacterMood[] = ['neutral', 'happy', 'encouraging', 'thinking']

const MOOD_LABELS: Record<CharacterMood, string> = {
  neutral: 'Neutro',
  happy: 'Feliz',
  encouraging: 'Encorajador',
  thinking: 'Pensando',
}

type Props = {
  characterId?: CharacterId
  mood?: CharacterMood
  onChange: (id: CharacterId | undefined, mood: CharacterMood) => void
}

export const CharacterPicker = ({ characterId, mood = 'neutral', onChange }: Props) => {
  return (
    <div className="space-y-3 rounded-xl border border-ink/15 bg-white p-3">
      <p className="text-xs font-black uppercase tracking-wide text-ink/50">Personagem</p>

      {/* Character row — horizontal scroll for overflow */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {/* None option */}
        <button
          type="button"
          onClick={() => onChange(undefined, mood)}
          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border-2 text-lg transition ${
            !characterId ? 'border-primaryDark bg-primary/15' : 'border-ink/15 bg-shell hover:border-primary/40'
          }`}
          title="Sem personagem"
        >
          —
        </button>
        {CHARACTERS.map((id) => (
          <button
            key={id}
            type="button"
            onClick={() => onChange(id, mood)}
            className={`shrink-0 rounded-2xl border-2 transition ${
              characterId === id ? 'border-primaryDark bg-primary/15' : 'border-ink/15 hover:border-primary/40'
            }`}
          >
            <CharacterAvatar id={id} mood={mood} className="h-12 w-12" />
          </button>
        ))}
      </div>

      {/* Mood row — only if a character is selected */}
      {characterId && (
        <div className="flex flex-wrap gap-2">
          {MOODS.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => onChange(characterId, m)}
              className={`rounded-lg border px-2 py-1 text-xs font-bold transition ${
                mood === m
                  ? 'border-primaryDark bg-primary/15 text-ink'
                  : 'border-ink/15 bg-shell text-ink/60 hover:border-primary/40'
              }`}
            >
              {MOOD_LABELS[m]}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
