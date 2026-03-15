import { Button } from '@/components/ui/Button'
import { cn } from '@/lib/utils/classNames'

type AudioButtonProps = {
  onClick: () => void
  label?: string
  iconOnly?: boolean
  className?: string
}

export const AudioButton = ({ onClick, label = '🔊 Escutar', iconOnly = false, className }: AudioButtonProps) => {
  return (
    <Button
      type="button"
      variant="secondary"
      fullWidth={false}
      className={cn(
        iconOnly
          ? 'inline-flex h-11 w-11 items-center justify-center rounded-full px-0 py-0 text-lg leading-none'
          : 'inline-flex items-center justify-center px-4 py-2 text-sm',
        className,
      )}
      onClick={onClick}
      aria-label={iconOnly ? 'Escutar áudio' : undefined}
    >
      {iconOnly ? (
        <span className="inline-flex h-full w-full items-center justify-center leading-none">🔊</span>
      ) : (
        label
      )}
    </Button>
  )
}
