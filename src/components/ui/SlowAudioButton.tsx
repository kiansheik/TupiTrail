import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/classNames'

type SlowAudioButtonProps = {
  onClick: () => void
  className?: string
}

export const SlowAudioButton = ({ onClick, className }: SlowAudioButtonProps) => {
  return (
    <Button
      type="button"
      variant="secondary"
      fullWidth={false}
      className={cn('inline-flex items-center justify-center px-4 py-2 text-lg leading-none', className)}
      onClick={onClick}
      aria-label="Escutar mais devagar"
    >
      <span className="inline-flex h-full w-full items-center justify-center leading-none -scale-x-100">🐢</span>
    </Button>
  )
}
