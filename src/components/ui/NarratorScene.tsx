import { motion } from 'framer-motion'
import type { PropsWithChildren } from 'react'

import { CharacterAvatar } from '@/components/ui/CharacterAvatar'
import { cn } from '@/lib/utils/classNames'

type NarratorSceneProps = PropsWithChildren<{
  title: string
  body: string
  characterId?: 'bird' | 'woman' | 'man' | 'nonbinary' | 'bear'
  mood?: 'neutral' | 'happy' | 'encouraging' | 'thinking'
  label?: string
  compact?: boolean
  dense?: boolean
}>

export const NarratorScene = ({
  title,
  body,
  characterId = 'bird',
  mood = 'encouraging',
  label = 'Tama diz',
  compact = false,
  dense = false,
  children,
}: NarratorSceneProps) => {
  return (
    <section
      className={cn(
        'narrator-stage rounded-[1.8rem] border-2 border-ink/20 px-4 py-5',
        compact && 'rounded-[1.4rem] px-3 py-3',
        dense && 'rounded-[1.2rem] px-2.5 py-2',
      )}
    >
      <div className={cn('relative z-10 flex flex-col items-center gap-4', compact && 'gap-2.5', dense && 'gap-1.5')}>
        <span
          className={cn(
            'rounded-full border-2 border-ink/20 bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-ink/70',
            compact && 'px-2.5 py-0.5 text-[10px]',
            dense && 'px-2 py-0.5 text-[9px]',
          )}
        >
          {label}
        </span>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className={cn('narrator-bubble w-full max-w-[320px]', compact && 'max-w-[300px] px-3 py-2.5')}
        >
          <p
            className={cn(
              'font-display text-2xl leading-none text-ink md:text-3xl',
              compact && 'text-[1.6rem]',
              dense && 'text-[1.25rem]',
            )}
          >
            {title}
          </p>
          <p
            className={cn(
              'mt-2 text-xs font-extrabold text-ink/75 md:text-sm',
              compact && 'mt-1.5 text-xs',
              dense && 'mt-1 text-[11px]',
            )}
          >
            {body}
          </p>
          <div className="narrator-tail" aria-hidden />
        </motion.div>

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="drop-shadow-[0_12px_10px_rgba(17,24,39,0.22)]"
        >
          <CharacterAvatar
            id={characterId}
            mood={mood}
            className={dense ? 'h-16 w-16' : compact ? 'h-24 w-24' : 'h-24 w-24 md:h-32 md:w-32'}
          />
        </motion.div>

        {children ? <div className="w-full">{children}</div> : null}
      </div>
    </section>
  )
}
