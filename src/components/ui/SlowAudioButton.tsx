import { Button } from '@/components/ui/Button'

type SlowAudioButtonProps = {
  onClick: () => void
}

export const SlowAudioButton = ({ onClick }: SlowAudioButtonProps) => {
  return (
    <Button type="button" variant="secondary" fullWidth={false} className="px-4 py-2 text-lg" onClick={onClick}>
      <span className="inline-block -scale-x-100 leading-none">🐢</span>
    </Button>
  )
}
