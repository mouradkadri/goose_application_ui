export interface StoredResume {
  id: string
  name: string
  text: string
  uploadedAt: string
  isActive: boolean
}

const KEY = 'goosejobs_resumes_v1'
const LEGACY_KEY = 'goosejobs_master_resume'

function persist(resumes: StoredResume[]): void {
  try { localStorage.setItem(KEY, JSON.stringify(resumes)) } catch {}
}

export const resumeStore = {
  getAll(): StoredResume[] {
    if (typeof window === 'undefined') return []
    try {
      const raw = localStorage.getItem(KEY)
      if (raw) return JSON.parse(raw) as StoredResume[]
      // One-time migration from the legacy single-resume key
      const legacy = localStorage.getItem(LEGACY_KEY)
      if (legacy) {
        const resume: StoredResume = {
          id: crypto.randomUUID(),
          name: 'My Resume',
          text: legacy,
          uploadedAt: new Date().toISOString(),
          isActive: true,
        }
        persist([resume])
        localStorage.removeItem(LEGACY_KEY)
        return [resume]
      }
    } catch {}
    return []
  },

  getActive(): StoredResume | null {
    return this.getAll().find(r => r.isActive) ?? null
  },

  /** Adds a resume. If one with the same name already exists, updates its text. Makes it active. */
  add(name: string, text: string): StoredResume {
    const all = this.getAll()
    const existing = all.find(r => r.name === name)
    if (existing) {
      const updated = all.map(r => ({
        ...r,
        isActive: r.id === existing.id,
        ...(r.id === existing.id ? { text, uploadedAt: new Date().toISOString() } : {}),
      }))
      persist(updated)
      return updated.find(r => r.id === existing.id)!
    }
    const resume: StoredResume = {
      id: crypto.randomUUID(),
      name,
      text,
      uploadedAt: new Date().toISOString(),
      isActive: true,
    }
    persist([...all.map(r => ({ ...r, isActive: false })), resume])
    return resume
  },

  setActive(id: string): void {
    persist(this.getAll().map(r => ({ ...r, isActive: r.id === id })))
  },

  remove(id: string): void {
    const all = this.getAll()
    const target = all.find(r => r.id === id)
    const remaining = all.filter(r => r.id !== id)
    if (target?.isActive && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isActive: true }
    }
    persist(remaining)
  },
}
