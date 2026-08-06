// Persistent localStorage store for AI search session history.
// Each session records which resume file was used, location, timing, and results.

export interface SearchSession {
  id: string
  resumeName: string
  location: string | null
  startedAt: string
  completedAt?: string
  jobCount: number
}

const KEY = 'goosejobs_search_sessions'
const MAX_SESSIONS = 50

function readAll(): SearchSession[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(KEY) || '[]') }
  catch { return [] }
}

function writeAll(sessions: SearchSession[]): void {
  localStorage.setItem(KEY, JSON.stringify(sessions.slice(0, MAX_SESSIONS)))
}

export const searchSessions = {
  getAll(): SearchSession[] {
    return readAll()
  },

  save(session: SearchSession): void {
    const existing = readAll().filter(s => s.id !== session.id)
    writeAll([session, ...existing])
  },

  complete(id: string, jobCount: number): void {
    const all = readAll()
    const idx = all.findIndex(s => s.id === id)
    if (idx !== -1) {
      all[idx] = { ...all[idx], completedAt: new Date().toISOString(), jobCount }
      writeAll(all)
    }
  },

  getById(id: string): SearchSession | null {
    return readAll().find(s => s.id === id) ?? null
  },
}
