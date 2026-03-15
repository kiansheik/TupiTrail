import { motion } from 'framer-motion'

export const NewWordBadge = () => {
  return (
    <motion.span
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ repeat: Infinity, duration: 1.2, ease: 'easeInOut' }}
      className="inline-flex rounded-full border-2 border-accent bg-yellow-100 px-3 py-1 text-xs font-black uppercase tracking-wide text-yellow-800"
    >
      Palavra nova
    </motion.span>
  )
}
