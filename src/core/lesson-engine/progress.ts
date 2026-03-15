export const computeAccuracy = (correct: number, total: number): number => {
  if (total === 0) {
    return 0
  }
  return Math.round((correct / total) * 100)
}

export const computeDurationSec = (startedAtISO: string): number => {
  const startedAt = Date.parse(startedAtISO)
  if (Number.isNaN(startedAt)) {
    return 0
  }

  const durationMs = Date.now() - startedAt
  return Math.max(0, Math.round(durationMs / 1000))
}

export const durationLabel = (durationSec: number): string => {
  if (durationSec < 60) {
    return `${durationSec}s de foco forte`
  }

  const minutes = Math.floor(durationSec / 60)
  const seconds = durationSec % 60
  if (seconds === 0) {
    return `${minutes}m de ritmo excelente`
  }

  return `${minutes}m ${seconds}s de ritmo excelente`
}
