import { AnimatePresence, motion } from 'framer-motion'
import { useCallback, useEffect, useRef, useState } from 'react'

import { createAudioUrl, deleteAudioBlob, saveAudioBlob } from '@/lib/builder/audioStorage'

type Props = {
  blobKey: string
  label: string
  mimeType?: string
  onSaved?: () => void
}

type State = 'idle' | 'countdown' | 'recording' | 'playing'

export const AudioRecorder = ({ blobKey, label, mimeType = 'audio/webm', onSaved }: Props) => {
  const [state, setState] = useState<State>('idle')
  const [countdown, setCountdown] = useState(0)
  const [hasBlob, setHasBlob] = useState(false)
  const mrRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const audioRef = useRef<HTMLAudioElement | null>(null)

  useEffect(() => {
    createAudioUrl(blobKey).then((url) => {
      setHasBlob(!!url)
      if (url) URL.revokeObjectURL(url)
    })
  }, [blobKey])

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mr = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported(mimeType) ? mimeType : undefined,
      })
      chunksRef.current = []
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }
      mr.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: mr.mimeType || mimeType })
        await saveAudioBlob(blobKey, blob)
        setHasBlob(true)
        setState('idle')
        stream.getTracks().forEach((t) => t.stop())
        onSaved?.()
      }
      mr.start()
      mrRef.current = mr
      setState('recording')
    } catch {
      setState('idle')
      alert('Acesso ao microfone negado.')
    }
  }, [blobKey, mimeType, onSaved])

  // Countdown tick: 400ms per step
  useEffect(() => {
    if (state !== 'countdown' || countdown === 0) return
    const id = setTimeout(() => setCountdown((c) => c - 1), 400)
    return () => clearTimeout(id)
  }, [state, countdown])

  // When countdown hits 0, start recording via setTimeout so setState stays async
  useEffect(() => {
    if (state !== 'countdown' || countdown !== 0) return
    const id = setTimeout(startRecording, 0)
    return () => clearTimeout(id)
  }, [state, countdown, startRecording])

  const handleRecordClick = () => {
    setState('countdown')
    setCountdown(3)
  }

  const stopRecording = () => mrRef.current?.stop()

  const play = async () => {
    const url = await createAudioUrl(blobKey)
    if (!url) return
    const audio = new Audio(url)
    audioRef.current = audio
    setState('playing')
    audio.play()
    audio.onended = () => {
      setState('idle')
      URL.revokeObjectURL(url)
    }
  }

  const stopPlay = () => {
    audioRef.current?.pause()
    setState('idle')
  }

  const clearRecording = async () => {
    audioRef.current?.pause()
    await deleteAudioBlob(blobKey)
    setHasBlob(false)
    setState('idle')
  }

  const showPlayback = hasBlob && state !== 'recording' && state !== 'countdown'

  return (
    <div className="flex flex-wrap items-center gap-2 rounded-xl border border-ink/15 bg-white px-3 py-2">
      <span className="min-w-0 flex-1 text-sm font-bold text-ink/70">{label}</span>

      {state === 'countdown' && countdown > 0 ? (
        <div className="flex h-8 w-12 items-center justify-center overflow-hidden">
          <AnimatePresence mode="popLayout">
            <motion.span
              key={countdown}
              initial={{ scale: 1.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.4, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="text-xl font-black text-red-500"
            >
              {countdown}
            </motion.span>
          </AnimatePresence>
        </div>
      ) : state === 'recording' ? (
        <button
          type="button"
          onClick={stopRecording}
          className="flex animate-pulse items-center gap-1 rounded-lg border border-red-400 bg-red-500 px-3 py-1.5 text-xs font-black text-white"
        >
          <span className="text-base leading-none">⏹</span> Parar
        </button>
      ) : (
        <button
          type="button"
          onClick={handleRecordClick}
          className="flex items-center gap-1 rounded-lg border border-red-300 bg-red-50 px-3 py-1.5 text-xs font-black text-red-600 transition hover:bg-red-100"
        >
          <span className="text-base leading-none">⏺</span> {hasBlob ? 'Regravar' : 'Gravar'}
        </button>
      )}

      {showPlayback && (
        <>
          {state !== 'playing' ? (
            <button
              type="button"
              onClick={play}
              className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-black text-primary transition hover:bg-primary/20"
            >
              <span className="text-base leading-none">▶</span> Ouvir
            </button>
          ) : (
            <button
              type="button"
              onClick={stopPlay}
              className="flex items-center gap-1 rounded-lg border border-primary/40 bg-primary px-3 py-1.5 text-xs font-black text-white"
            >
              <span className="text-base leading-none">⏹</span> Parar
            </button>
          )}
          <button
            type="button"
            onClick={clearRecording}
            className="flex items-center gap-1 rounded-lg border border-ink/15 bg-shell px-2 py-1.5 text-xs font-black text-ink/45 transition hover:border-red-200 hover:bg-red-50 hover:text-red-500"
            title="Apagar gravação"
          >
            🗑
          </button>
        </>
      )}

      {showPlayback && (
        <span className="text-xs font-bold text-success">✓ gravado</span>
      )}
    </div>
  )
}
