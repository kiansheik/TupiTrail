import type { AudioSpec } from '@/core/lesson-engine/types'

let currentAudio: HTMLAudioElement | null = null

type PlayAudioOptions = {
  playbackRate?: number
  fallbackAudioSpec?: AudioSpec
  fallbackPlaybackRate?: number
}

const swapCommonAudioExtension = (src: string): string | null => {
  if (/\.mp3($|\?)/i.test(src)) {
    return src.replace(/\.mp3($|\?)/i, '.ogg$1')
  }
  if (/\.ogg($|\?)/i.test(src)) {
    return src.replace(/\.ogg($|\?)/i, '.mp3$1')
  }
  return null
}

export const getAudioSourceCandidates = (src: string): string[] => {
  const candidates = [src]
  const swapped = swapCommonAudioExtension(src)
  if (swapped && swapped !== src) {
    candidates.push(swapped)
  }
  return candidates
}

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

export const playAudioSpec = (audioSpec: AudioSpec | undefined, options?: PlayAudioOptions): void => {
  if (!audioSpec) {
    return
  }

  stopSpeech()

  if (audioSpec.mode === 'file') {
    const sources = getAudioSourceCandidates(audioSpec.src)
    let sourceIndex = 0
    const element = new Audio(sources[sourceIndex])
    if (options?.playbackRate && Number.isFinite(options.playbackRate)) {
      element.playbackRate = Math.max(0.5, Math.min(1.2, options.playbackRate))
    }
    const onError = () => {
      if (sourceIndex + 1 >= sources.length) {
        if (options?.fallbackAudioSpec) {
          playAudioSpec(options.fallbackAudioSpec, {
            playbackRate: options.fallbackPlaybackRate,
          })
        }
        return
      }
      sourceIndex += 1
      element.src = sources[sourceIndex]
      element.load()
      element.play().catch(() => {
        // ignore browser autoplay constraints in prototype mode
      })
    }
    element.addEventListener('error', onError)
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
