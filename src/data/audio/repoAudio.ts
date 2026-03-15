import type { LessonAudioSpec } from '@/core/lesson-engine/template-types'

type RepoAudioOptions = {
  id?: string
  required?: boolean
  slowSrc?: string
}

const toRepoPath = (value: string): string => {
  if (value.startsWith('/')) {
    return value
  }
  return `/audio/${value.replace(/^audio\//, '').replace(/^\/+/, '')}`
}

export const repoAudio = (src: string, options?: RepoAudioOptions): LessonAudioSpec => ({
  mode: 'file',
  src: toRepoPath(src),
  slowSrc: options?.slowSrc ? toRepoPath(options.slowSrc) : undefined,
  required: options?.required ?? true,
  id: options?.id,
})
