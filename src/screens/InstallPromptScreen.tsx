import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { uiStrings } from '@/data/ui'
import { canPromptInstall, listenForInstallPrompt, triggerInstallPrompt } from '@/lib/pwa/installPrompt'
import { useAppStore } from '@/store/useAppStore'

export const InstallPromptScreen = () => {
  const navigate = useNavigate()
  const markInstallPromptSeen = useAppStore((state) => state.markInstallPromptSeen)
  const [available, setAvailable] = useState(canPromptInstall())

  useEffect(() => {
    const cleanup = listenForInstallPrompt((isAvailable) => setAvailable(isAvailable))
    return cleanup
  }, [])

  const goMap = () => {
    markInstallPromptSeen()
    navigate('/map')
  }

  const install = async () => {
    await triggerInstallPrompt()
    goMap()
  }

  return (
    <ScreenScaffold
      title="Instale para acesso rápido"
      subtitle="Funciona como app na tela inicial"
      bottomSlot={
        <div className="space-y-2">
          <Button onClick={available ? install : goMap}>{uiStrings.addToHome}</Button>
          <Button variant="secondary" onClick={goMap}>
            {uiStrings.skipForNow}
          </Button>
        </div>
      }
    >
      <Card>
        <p className="text-sm font-bold text-ink/70">
          {available
            ? 'Seu navegador permite instalar agora.'
            : 'Se o botão nativo aparecer, você poderá instalar depois.'}
        </p>
      </Card>
    </ScreenScaffold>
  )
}
