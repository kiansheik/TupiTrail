import type { ReactNode } from 'react'
import { motion } from 'framer-motion'

import { cn } from '@/lib/utils/classNames'

const normalizeWord = (word: string): string => word.toLowerCase().replace(/[^a-z0-9]+/g, '')

const prettyWord = (word: string): string =>
  word
    .trim()
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/\b\w/g, (char) => char.toUpperCase())

const iconFromWord = (word?: string): ReactNode => {
  const normalized = normalizeWord(word ?? '')

  if (normalized.includes('coffee')) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path d="M5 8h10v7a4 4 0 01-4 4H9a4 4 0 01-4-4V8z" fill="#8a5a44" />
        <path d="M15 10h2a2 2 0 110 4h-2" fill="none" stroke="#8a5a44" strokeWidth="1.8" />
        <path d="M7 18h10" stroke="#5d3a2b" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    )
  }

  if (normalized.includes('tea')) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path d="M4 10h11v6a3 3 0 01-3 3H7a3 3 0 01-3-3v-6z" fill="#4caf7a" />
        <path d="M15 12h2a2 2 0 110 3h-2" fill="none" stroke="#2f7a56" strokeWidth="1.8" />
        <path d="M9 8c0-1 1-2 2-2 0 1-1 2-2 2z" fill="#2f7a56" />
      </svg>
    )
  }

  if (normalized.includes('water')) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path d="M12 4c3 4 5 6.6 5 9.1a5 5 0 11-10 0C7 10.6 9 8 12 4z" fill="#4cb7ff" />
      </svg>
    )
  }

  if (normalized.includes('milk')) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path d="M9 4h6l1 2v12a2 2 0 01-2 2h-4a2 2 0 01-2-2V6l1-2z" fill="#e7f1ff" stroke="#9cb4ce" strokeWidth="1.2" />
      </svg>
    )
  }

  if (normalized.includes('sugar')) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <rect x="6" y="6" width="12" height="12" rx="2.5" fill="#fff6d6" stroke="#d9b45a" strokeWidth="1.2" />
      </svg>
    )
  }

  if (normalized.includes('or')) {
    return (
      <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
        <path d="M6 6h12M12 6v12" stroke="#7a49ff" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 13l-4 4M12 13l4 4" stroke="#7a49ff" strokeWidth="2" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden>
      <path d="M12 4l2.2 4.5L19 9l-3.5 3.3.9 4.7L12 14.8 7.6 17l.9-4.7L5 9l4.8-.5L12 4z" fill="#7a49ff" />
    </svg>
  )
}

type NewWordBadgeProps = {
  word?: string
}

type NewWordWordProps = {
  word: string
  className?: string
}

export const NewWordWord = ({ word, className }: NewWordWordProps) => {
  return <span className={cn('new-word-fancy inline-block', className)}>{prettyWord(word)}</span>
}

export const NewWordBadge = ({ word }: NewWordBadgeProps) => {
  return (
    <motion.span
      animate={{ y: [0, -2, 0], scale: [1, 1.02, 1] }}
      transition={{ repeat: Infinity, duration: 1.8, ease: 'easeInOut' }}
      className="inline-flex items-center gap-2 rounded-full border-2 border-[#9f7cff] bg-[#efe9ff] px-3 py-1"
    >
      <span className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-[#8b69f0] bg-white text-[#7a49ff]">
        {iconFromWord(word)}
      </span>
      <span className="text-[11px] font-black uppercase tracking-[0.08em] text-[#6a44d3]">Palavra nova</span>
    </motion.span>
  )
}
