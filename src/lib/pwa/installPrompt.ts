export type DeferredPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let deferredPrompt: DeferredPromptEvent | null = null

export const listenForInstallPrompt = (onChange: (available: boolean) => void): (() => void) => {
  const handler = (event: Event): void => {
    const promptEvent = event as DeferredPromptEvent
    promptEvent.preventDefault()
    deferredPrompt = promptEvent
    onChange(true)
  }

  window.addEventListener('beforeinstallprompt', handler)

  const installedHandler = (): void => {
    deferredPrompt = null
    onChange(false)
  }

  window.addEventListener('appinstalled', installedHandler)

  return () => {
    window.removeEventListener('beforeinstallprompt', handler)
    window.removeEventListener('appinstalled', installedHandler)
  }
}

export const canPromptInstall = (): boolean => deferredPrompt !== null

export const triggerInstallPrompt = async (): Promise<boolean> => {
  if (!deferredPrompt) {
    return false
  }

  await deferredPrompt.prompt()
  const choice = await deferredPrompt.userChoice
  deferredPrompt = null
  return choice.outcome === 'accepted'
}
