import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ScreenScaffold } from '@/components/layout/ScreenScaffold'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { uiStrings } from '@/data/ui'
import { useAppStore } from '@/store/useAppStore'

const ReminderIllustration = () => (
  <svg viewBox="0 0 280 180" className="w-full max-w-[280px]" aria-hidden>
    <defs>
      <linearGradient id="reminderGlow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#b7f0d7" />
        <stop offset="100%" stopColor="#fff2c7" />
      </linearGradient>
    </defs>

    <rect x="8" y="10" width="264" height="160" rx="28" fill="url(#reminderGlow)" stroke="#1b2b262e" strokeWidth="3" />
    <rect x="82" y="36" width="116" height="106" rx="20" fill="#fff" stroke="#1b2b2633" strokeWidth="3" />
    <rect x="98" y="52" width="84" height="20" rx="8" fill="#e7f6ef" />
    <circle cx="112" cy="102" r="10" fill="#2eb489" />
    <path d="M108 102h8M112 98v8" stroke="#fff" strokeWidth="2.8" strokeLinecap="round" />
    <path d="M132 98h40M132 108h28" stroke="#7bbfa6" strokeWidth="4" strokeLinecap="round" />
    <circle cx="58" cy="70" r="11" fill="#ffd166" />
    <circle cx="224" cy="62" r="9" fill="#ff9d7a" />
    <circle cx="220" cy="130" r="12" fill="#7cc7ff" />
  </svg>
)

export const NotificationPromptScreen = () => {
  const navigate = useNavigate()
  const setNotificationPreference = useAppStore((state) => state.setNotificationPreference)
  const [status, setStatus] = useState<string>('Lembretes ajudam a manter a ofensiva ativa.')
  const [isRequesting, setIsRequesting] = useState(false)
  const advanceTimeoutRef = useRef<number | null>(null)

  const scheduleAdvance = (delayMs = 700) => {
    if (advanceTimeoutRef.current !== null) {
      window.clearTimeout(advanceTimeoutRef.current)
    }
    advanceTimeoutRef.current = window.setTimeout(() => {
      navigate('/onboarding/benefits')
      advanceTimeoutRef.current = null
    }, delayMs)
  }

  useEffect(() => {
    return () => {
      if (advanceTimeoutRef.current !== null) {
        window.clearTimeout(advanceTimeoutRef.current)
      }
    }
  }, [])

  const requestPermission = async () => {
    if (isRequesting) {
      return
    }

    setIsRequesting(true)

    const hasNotificationApi = typeof window.Notification?.requestPermission === 'function'
    if (!hasNotificationApi) {
      setNotificationPreference(true, false)
      setStatus(
        'Seu navegador não suporta notificações. Esta é a razão pela qual pode não funcionar no seu dispositivo móvel.',
      )
      scheduleAdvance()
      setIsRequesting(false)
      return
    }

    if (!window.isSecureContext) {
      setNotificationPreference(true, false)
      setStatus(
        'As notificações requerem um contexto seguro (HTTPS), o que pode ser o motivo de não funcionar no seu telemóvel.',
      )
      scheduleAdvance()
      setIsRequesting(false)
      return
    }

    if (window.Notification.permission === 'granted') {
      setNotificationPreference(true, true)
      setStatus('Notificações já estavam ativadas. Avançando...')
      scheduleAdvance(350)
      setIsRequesting(false)
      return
    }

    if (window.Notification.permission === 'denied') {
      setNotificationPreference(true, false)
      setStatus('Notificações bloqueadas no navegador. Continuando sem lembretes.')
      scheduleAdvance()
      setIsRequesting(false)
      return
    }

    try {
      const permission = await window.Notification.requestPermission()
      const granted = permission === 'granted'
      setNotificationPreference(true, granted)
      if (granted) {
        setStatus('Notificações ativadas. Avançando...')
        scheduleAdvance(500)
      } else {
        setStatus('Não foi possível ativar agora. Continuando sem lembretes.')
        scheduleAdvance()
      }
    } catch {
      setNotificationPreference(true, false)
      setStatus('Não foi possível ativar notificações neste dispositivo. Continuando sem lembretes.')
      scheduleAdvance()
    } finally {
      setIsRequesting(false)
    }
  }

  const continueFlow = () => {
    setNotificationPreference(true, false)
    navigate('/onboarding/benefits')
  }

  return (
    <ScreenScaffold
      title={uiStrings.notificationsTitle}
      subtitle="No prototype, lembretes reais são best effort."
      contentClassName="h-full"
      bottomSlot={
        <div className="space-y-2">
          <Button onClick={requestPermission} disabled={isRequesting}>
            {uiStrings.notificationsAllow}
          </Button>
          <Button variant="secondary" onClick={continueFlow}>
            {uiStrings.notificationsLater}
          </Button>
        </div>
      }
    >
      <Card className="flex h-full flex-1 flex-col items-center justify-center gap-4 px-5 text-center">
        <ReminderIllustration />
        <p className="text-sm font-bold leading-snug text-ink/70">{status}</p>
      </Card>
    </ScreenScaffold>
  )
}
