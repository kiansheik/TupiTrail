import type { LessonMapNode } from '@/core/lesson-engine/types'

import { cn } from '@/lib/utils/classNames'

type PathMapProps = {
  nodes: LessonMapNode[]
  onNodeClick?: (node: LessonMapNode) => void
}

const nodeSymbol = (type: LessonMapNode['type']): string => {
  if (type === 'chest') return '🎁'
  if (type === 'checkpoint') return '⭐'
  return '📘'
}

// Cycles through distinct hues per unit
const UNIT_PALETTES = [
  { bg: 'bg-primary', border: 'border-primaryDark', line: '#6ec87a' },       // unit1: green
  { bg: 'bg-[#6b8ff7]', border: 'border-[#4a6ce6]', line: '#a0b4fa' },       // unit2: blue
  { bg: 'bg-[#f4813a]', border: 'border-[#d4641f]', line: '#f4ac80' },       // unit3: orange
  { bg: 'bg-[#b96ef7]', border: 'border-[#8c40d4]', line: '#d6a8fa' },       // unit4: purple
  { bg: 'bg-[#f7c948]', border: 'border-[#c49800]', line: '#ffe080' },       // unit5: yellow
]

function unitPalette(unitId: string) {
  const match = unitId.match(/\d+$/)
  const idx = match ? (parseInt(match[0], 10) - 1) % UNIT_PALETTES.length : 0
  return UNIT_PALETTES[Math.max(0, idx)]
}

export const PathMap = ({ nodes, onNodeClick }: PathMapProps) => {
  return (
    <div className="relative mx-auto h-[440px] w-full rounded-3xl border-2 border-ink/15 bg-[linear-gradient(180deg,#f9f2dc_0%,#e7f6ea_100%)] p-4">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 340 440" aria-hidden>
        {nodes.slice(0, -1).map((node, index) => {
          const next = nodes[index + 1]
          if (!next) return null

          const x1 = 170 + node.x
          const y1 = 52 + node.y
          const x2 = 170 + next.x
          const y2 = 52 + next.y

          return (
            <path
              key={`${node.id}-${next.id}`}
              d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
              stroke={unitPalette(node.unitId).line}
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {nodes.map((node) => {
        const palette = unitPalette(node.unitId)
        return (
          <button
            key={node.id}
            type="button"
            onClick={() => onNodeClick?.(node)}
            disabled={!node.unlocked}
            className={cn(
              'absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-2 text-2xl shadow-md transition',
              node.completed && `${palette.bg} ${palette.border} text-white`,
              !node.completed && node.unlocked && `${palette.border} bg-white`,
              !node.unlocked && 'border-ink/10 bg-slate-200 opacity-60',
            )}
            style={{
              transform: `translate(${node.x}px, ${node.y + 24}px) translateX(-50%)`,
            }}
            aria-label={`Node ${node.lessonId}`}
          >
            {nodeSymbol(node.type)}
          </button>
        )
      })}
    </div>
  )
}
