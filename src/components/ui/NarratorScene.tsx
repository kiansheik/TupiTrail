import { motion } from 'framer-motion'
import type { PropsWithChildren } from 'react'

import { CharacterAvatar } from '@/components/ui/CharacterAvatar'

type NarratorSceneProps = PropsWithChildren<{
  title: string
  body: string
  characterId?: 'bird' | 'woman' | 'man' | 'nonbinary' | 'bear'
  mood?: 'neutral' | 'happy' | 'encouraging' | 'thinking'
  label?: string
}>

export const NarratorScene = ({
  title,
  body,
  characterId = 'bird',
  mood = 'encouraging',
  label = 'Tama diz',
  children,
}: NarratorSceneProps) => {
  return (
    <section className="narrator-stage rounded-[1.8rem] border-2 border-ink/20 px-4 py-5">
      <div className="relative z-10 flex flex-col items-center gap-4">
        <span className="rounded-full border-2 border-ink/20 bg-white/90 px-3 py-1 text-[11px] font-black uppercase tracking-[0.08em] text-ink/70">
          {label}
        </span>

        <motion.div
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.35 }}
          className="narrator-bubble w-full max-w-[320px]"
        >
          <p className="font-display text-3xl leading-none text-ink">{title}</p>
          <p className="mt-2 text-sm font-extrabold text-ink/75">{body}</p>
          <div className="narrator-tail" aria-hidden />
        </motion.div>

        <motion.div
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
          className="drop-shadow-[0_12px_10px_rgba(17,24,39,0.22)]"
        >
          <CharacterAvatar id={characterId} mood={mood} className="h-32 w-32" />
        </motion.div>

        {children ? <div className="w-full">{children}</div> : null}
      </div>
    </section>
  )
}
