import type { LessonAudioSpec } from '@/core/lesson-engine/template-types'

type RepoAudioOptions = {
  id?: string
  required?: boolean
  slowSrc?: string
}

const toRepoPath = (value: string): string => {
  // value can be 'unit1/...' or 'audio/unit1/...'
  const audioPath = value.startsWith('audio/') ? value : `audio/${value}`
  const publicPath = `${import.meta.env.BASE_URL}${audioPath}`
  return publicPath
}

export const repoAudio = (src: string, options?: RepoAudioOptions): LessonAudioSpec => ({
  mode: 'file',
  src: toRepoPath(src),
  slowSrc: options?.slowSrc ? toRepoPath(options.slowSrc) : undefined,
  required: options?.required ?? true,
  id: options?.id,
})
