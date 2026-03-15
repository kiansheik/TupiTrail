import { Button } from '@/components/ui/Button'

type AudioButtonProps = {
  onClick: () => void
}

export const AudioButton = ({ onClick }: AudioButtonProps) => {
  return (
    <Button type="button" variant="secondary" fullWidth={false} className="px-4 py-2 text-sm" onClick={onClick}>
      Escutar
    </Button>
  )
}
