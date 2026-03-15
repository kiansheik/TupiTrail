import type { LessonMapNode } from '@/core/lesson-engine/types'

import { cn } from '@/lib/utils/classNames'

type PathMapProps = {
  nodes: LessonMapNode[]
  onNodeClick?: (node: LessonMapNode) => void
}

const nodeSymbol = (type: LessonMapNode['type']): string => {
  if (type === 'chest') {
    return '🎁'
  }
  if (type === 'checkpoint') {
    return '⭐'
  }
  return '📘'
}

export const PathMap = ({ nodes, onNodeClick }: PathMapProps) => {
  return (
    <div className="relative mx-auto h-[440px] w-full rounded-3xl border-2 border-ink/15 bg-[linear-gradient(180deg,#f9f2dc_0%,#e7f6ea_100%)] p-4">
      <svg className="pointer-events-none absolute inset-0 h-full w-full" viewBox="0 0 340 440" aria-hidden>
        {nodes.slice(0, -1).map((node, index) => {
          const next = nodes[index + 1]
          if (!next) {
            return null
          }

          const x1 = 170 + node.x
          const y1 = 52 + node.y
          const x2 = 170 + next.x
          const y2 = 52 + next.y

          return (
            <path
              key={`${node.id}-${next.id}`}
              d={`M ${x1} ${y1} C ${x1} ${(y1 + y2) / 2}, ${x2} ${(y1 + y2) / 2}, ${x2} ${y2}`}
              stroke="#a6d6bf"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
            />
          )
        })}
      </svg>

      {nodes.map((node) => (
        <button
          key={node.id}
          type="button"
          onClick={() => onNodeClick?.(node)}
          disabled={!node.unlocked}
          className={cn(
            'absolute left-1/2 top-0 flex h-14 w-14 -translate-x-1/2 items-center justify-center rounded-full border-2 text-2xl shadow-md transition',
            node.completed && 'border-primaryDark bg-primary text-white',
            !node.completed && node.unlocked && 'border-ink/20 bg-white',
            !node.unlocked && 'border-ink/10 bg-slate-200 opacity-60',
          )}
          style={{
            transform: `translate(${node.x}px, ${node.y + 24}px) translateX(-50%)`,
          }}
          aria-label={`Node ${node.lessonId}`}
        >
          {nodeSymbol(node.type)}
        </button>
      ))}
    </div>
  )
}
