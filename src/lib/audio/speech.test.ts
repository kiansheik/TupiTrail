import { describe, expect, it, beforeEach, vi } from 'vitest'

import { playAudioSpec } from '@/lib/audio/speech'

describe('playAudioSpec (tts)', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it('calls speech synthesis with resume/cancel and speaks utterance text', () => {
    const cancel = vi.fn()
    const resume = vi.fn()
    const speak = vi.fn()

    Object.defineProperty(window, 'speechSynthesis', {
      configurable: true,
      value: {
        cancel,
        resume,
        speak,
        paused: true,
      },
    })

    class MockUtterance {
      text: string
      lang = ''
      rate = 1
      constructor(text: string) {
        this.text = text
      }
    }

    Object.defineProperty(window, 'SpeechSynthesisUtterance', {
      configurable: true,
      value: MockUtterance,
    })

    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => {
      callback(0)
      return 1
    })

    playAudioSpec({ mode: 'tts', text: 'coffee', lang: 'en-US', rate: 0.9 })

    expect(cancel).toHaveBeenCalled()
    expect(resume).toHaveBeenCalled()
    expect(speak).toHaveBeenCalledTimes(1)

    const utterance = speak.mock.calls[0]?.[0] as { text: string; lang: string; rate: number }
    expect(utterance.text).toBe('coffee')
    expect(utterance.lang).toBe('en-US')
    expect(utterance.rate).toBe(0.9)
  })
})
