import type { AudioSpec } from '@/core/lesson-engine/types'

let currentAudio: HTMLAudioElement | null = null

export const stopSpeech = (): void => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel()
  }
  if (currentAudio) {
    currentAudio.pause()
    currentAudio.currentTime = 0
    currentAudio = null
  }
}

export const playAudioSpec = (audioSpec: AudioSpec | undefined): void => {
  if (!audioSpec) {
    return
  }

  stopSpeech()

  if (audioSpec.mode === 'file') {
    const element = new Audio(audioSpec.src)
    element.play().catch(() => {
      // ignore browser autoplay constraints in prototype mode
    })
    currentAudio = element
    return
  }

  if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
    return
  }

  const synth = window.speechSynthesis
  synth.cancel()
  if (synth.paused) {
    synth.resume()
  }

  const utterance = new SpeechSynthesisUtterance(audioSpec.text)
  utterance.lang = audioSpec.lang
  utterance.rate = audioSpec.rate ?? 1

  // Some browsers are flaky if speak() is called in the same tick as cancel().
  requestAnimationFrame(() => {
    try {
      synth.speak(utterance)
    } catch {
      // ignore synthesis runtime failures in prototype mode
    }
  })
}
