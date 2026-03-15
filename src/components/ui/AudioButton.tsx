import { Button } from '@/components/ui/Button'

type AudioButtonProps = {
  onClick: () => void
  label?: string
}

export const AudioButton = ({ onClick, label = '🔊 Escutar' }: AudioButtonProps) => {
  return (
    <Button type="button" variant="secondary" fullWidth={false} className="px-4 py-2 text-sm" onClick={onClick}>
      {label}
    </Button>
  )
}
