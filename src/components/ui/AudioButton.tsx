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
      className={cn(iconOnly ? 'h-11 w-11 rounded-full px-0 py-0 text-lg' : 'px-4 py-2 text-sm', className)}
      onClick={onClick}
      aria-label={iconOnly ? 'Escutar áudio' : undefined}
    >
      {iconOnly ? '🔊' : label}
    </Button>
  )
}
