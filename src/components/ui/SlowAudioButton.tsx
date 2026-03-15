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
      className={cn('px-4 py-2 text-lg', className)}
      onClick={onClick}
    >
      <span className="inline-block -scale-x-100 leading-none">🐢</span>
    </Button>
  )
}
