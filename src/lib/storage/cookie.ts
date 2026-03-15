const ONE_YEAR_SEC = 60 * 60 * 24 * 365

export const setCookie = (name: string, value: string, maxAgeSec = ONE_YEAR_SEC): void => {
  document.cookie = `${name}=${encodeURIComponent(value)}; max-age=${maxAgeSec}; path=/; SameSite=Lax`
}

export const getCookie = (name: string): string | null => {
  const prefix = `${name}=`
  const items = document.cookie.split(';').map((entry) => entry.trim())
  const match = items.find((entry) => entry.startsWith(prefix))
  if (!match) {
    return null
  }
  return decodeURIComponent(match.slice(prefix.length))
}
