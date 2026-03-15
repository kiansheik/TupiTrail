import { isoToday } from '@/lib/utils/time'

const weekdayOrder = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

export const StreakCalendar = ({ week }: { week: Record<string, boolean> }) => {
  const today = isoToday()

  return (
    <div className="rounded-3xl border-2 border-ink/20 bg-white p-4">
      <p className="text-sm font-bold text-ink/60">Semana atual</p>
      <div className="mt-3 grid grid-cols-7 gap-2">
        {weekdayOrder.map((label, index) => {
          const date = new Date()
          const dayOffset = index - ((date.getDay() + 6) % 7)
          date.setDate(date.getDate() + dayOffset)
          const key = date.toISOString().slice(0, 10)
          const active = Boolean(week[key])
          const isToday = key === today

          return (
            <div
              key={label}
              className={`rounded-2xl border-2 px-1 py-2 text-center text-xs font-black ${
                active
                  ? 'border-primaryDark bg-primary/20 text-ink'
                  : 'border-ink/15 bg-shell text-ink/45'
              } ${isToday ? 'ring-2 ring-accent' : ''}`}
            >
              {label}
            </div>
          )
        })}
      </div>
    </div>
  )
}
