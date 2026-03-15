import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { uiStrings } from '@/data/ui'
import { useAppStore } from '@/store/useAppStore'

export const NotificationPromptScreen = () => {
  const navigate = useNavigate()
  const setNotificationPreference = useAppStore((state) => state.setNotificationPreference)
  const [status, setStatus] = useState<string>('Lembretes ajudam a manter a ofensiva ativa.')

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      setNotificationPreference(true, false)
      setStatus('Seu navegador não suporta notificações nesta demo.')
      return
    }

    const permission = await Notification.requestPermission()
    const granted = permission === 'granted'
    setNotificationPreference(true, granted)
    setStatus(granted ? 'Notificações ativadas.' : 'Sem problema, você pode ativar depois.')
  }

  const continueFlow = () => {
    navigate('/onboarding/benefits')
  }

  return (
    <ScreenScaffold
      title={uiStrings.notificationsTitle}
      subtitle="No prototype, lembretes reais são best effort."
      bottomSlot={
        <div className="space-y-2">
          <Button onClick={requestPermission}>{uiStrings.notificationsAllow}</Button>
          <Button variant="secondary" onClick={continueFlow}>
            {uiStrings.notificationsLater}
          </Button>
        </div>
      }
    >
      <Card>
        <p className="text-sm font-bold text-ink/70">{status}</p>
      </Card>
      <div className="mt-4">
        <Button variant="ghost" onClick={continueFlow}>
          Continuar sem notificações
        </Button>
      </div>
    </ScreenScaffold>
  )
}
