const KEY = 'goosejobs_master_resume'

export const masterResume = {
  get(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(KEY)
  },

  set(text: string): void {
    localStorage.setItem(KEY, text)
  },

  clear(): void {
    localStorage.removeItem(KEY)
  },
}
