const SESSION_KEY = 'goosejobs_session_id'

export const session = {
  getId(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem(SESSION_KEY)
  },

  setId(id: string): void {
    localStorage.setItem(SESSION_KEY, id)
  },

  getHeaders(): Record<string, string> {
    const id = this.getId()
    return id ? { 'x-session-id': id } : {}
  },
}
