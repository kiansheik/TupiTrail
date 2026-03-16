import { motion, type Transition } from 'framer-motion'

import { cn } from '@/lib/utils/classNames'

type CharacterAvatarProps = {
  id: 'bird' | 'woman' | 'man' | 'nonbinary' | 'bear'
  mood?: 'neutral' | 'happy' | 'encouraging' | 'thinking'
  className?: string
  blink?: boolean
}

const Mouth = ({ mood }: { mood?: CharacterAvatarProps['mood'] }) => {
  if (mood === 'thinking') {
    return <line x1="45" y1="68" x2="55" y2="68" stroke="#1b2b26" strokeWidth="3" strokeLinecap="round" />
  }
  if (mood === 'neutral') {
    return <line x1="43" y1="70" x2="57" y2="70" stroke="#1b2b26" strokeWidth="3" strokeLinecap="round" />
  }
  return <path d="M42 67c4 8 12 8 16 0" fill="none" stroke="#1b2b26" strokeWidth="3" strokeLinecap="round" />
}

export const CharacterAvatar = ({ id, mood = 'neutral', className, blink = false }: CharacterAvatarProps) => {
  if (id === 'bird') {
    const blinkTransition: Transition = {
      duration: 2.8,
      repeat: Infinity,
      times: [0, 0.38, 0.42, 0.46, 1],
      ease: 'easeInOut',
    }

    return (
      <svg viewBox="0 0 100 100" className={cn('h-16 w-16', className)} aria-label="Bird mascot">
        <circle cx="50" cy="50" r="42" fill="#2eb489" />
        {blink ? (
          <>
            <motion.g
              animate={{ scaleY: [1, 1, 0.14, 1, 1] }}
              transition={blinkTransition}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <ellipse cx="36" cy="44" rx="6" ry="6" fill="#fff" />
              <ellipse cx="36" cy="44" rx="2.5" ry="2.5" fill="#1b2b26" />
            </motion.g>
            <motion.g
              animate={{ scaleY: [1, 1, 0.14, 1, 1] }}
              transition={blinkTransition}
              style={{ transformBox: 'fill-box', transformOrigin: 'center' }}
            >
              <ellipse cx="64" cy="44" rx="6" ry="6" fill="#fff" />
              <ellipse cx="64" cy="44" rx="2.5" ry="2.5" fill="#1b2b26" />
            </motion.g>
          </>
        ) : (
          <>
            <circle cx="36" cy="44" r="6" fill="#fff" />
            <circle cx="64" cy="44" r="6" fill="#fff" />
            <circle cx="36" cy="44" r="2.5" fill="#1b2b26" />
            <circle cx="64" cy="44" r="2.5" fill="#1b2b26" />
          </>
        )}
        <polygon points="50,52 40,60 60,60" fill="#ffb703" />
        <Mouth mood={mood} />
        <circle cx="73" cy="30" r="7" fill="#ffd166" />
      </svg>
    )
  }

  if (id === 'woman') {
    return (
      <svg viewBox="0 0 100 100" className={cn('h-16 w-16', className)} aria-label="Woman avatar">
        <circle cx="50" cy="50" r="42" fill="#ffb59a" />
        <path d="M18 52c0-24 14-38 32-38s32 14 32 38v16H18z" fill="#8b4d34" />
        <circle cx="38" cy="48" r="3" fill="#1b2b26" />
        <circle cx="62" cy="48" r="3" fill="#1b2b26" />
        <Mouth mood={mood} />
      </svg>
    )
  }

  if (id === 'man') {
    return (
      <svg viewBox="0 0 100 100" className={cn('h-16 w-16', className)} aria-label="Man avatar">
        <circle cx="50" cy="50" r="42" fill="#f6c48f" />
        <path d="M22 44c4-20 20-30 38-24 11 4 16 12 18 26H22z" fill="#355070" />
        <circle cx="38" cy="50" r="3" fill="#1b2b26" />
        <circle cx="62" cy="50" r="3" fill="#1b2b26" />
        <Mouth mood={mood} />
      </svg>
    )
  }

  if (id === 'nonbinary') {
    return (
      <svg viewBox="0 0 100 100" className={cn('h-16 w-16', className)} aria-label="Nonbinary avatar">
        <circle cx="50" cy="50" r="42" fill="#ffd166" />
        <path d="M18 54c0-22 14-36 32-36 22 0 32 16 32 36v12H18z" fill="#6a4c93" />
        <circle cx="38" cy="50" r="3" fill="#1b2b26" />
        <circle cx="62" cy="50" r="3" fill="#1b2b26" />
        <Mouth mood={mood} />
      </svg>
    )
  }

  return (
    <svg viewBox="0 0 100 100" className={cn('h-16 w-16', className)} aria-label="Bear avatar">
      <circle cx="50" cy="52" r="38" fill="#8d6e63" />
      <circle cx="24" cy="26" r="12" fill="#8d6e63" />
      <circle cx="76" cy="26" r="12" fill="#8d6e63" />
      <circle cx="24" cy="26" r="6" fill="#b08968" />
      <circle cx="76" cy="26" r="6" fill="#b08968" />
      <circle cx="50" cy="58" r="12" fill="#d4a373" />
      <circle cx="40" cy="48" r="3" fill="#1b2b26" />
      <circle cx="60" cy="48" r="3" fill="#1b2b26" />
      <Mouth mood={mood} />
    </svg>
  )
}
