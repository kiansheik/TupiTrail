import { Button } from '@/components/ui/Button'

type AudioButtonProps = {
  onClick: () => void
  label?: string
  iconOnly?: boolean
}

export const AudioButton = ({ onClick, label = '🔊 Escutar', iconOnly = false }: AudioButtonProps) => {
  return (
    <Button
      type="button"
      variant="secondary"
      fullWidth={false}
      className={iconOnly ? 'h-11 w-11 rounded-full px-0 py-0 text-lg' : 'px-4 py-2 text-sm'}
      onClick={onClick}
      aria-label={iconOnly ? 'Escutar áudio' : undefined}
    >
      {iconOnly ? '🔊' : label}
    </Button>
  )
}
