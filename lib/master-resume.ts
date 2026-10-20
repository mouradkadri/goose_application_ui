import { resumeStore } from './resume-store'

export const masterResume = {
  get(): string | null {
    if (typeof window === 'undefined') return null
    return resumeStore.getActive()?.text ?? null
  },
  set(text: string, name = 'My Resume'): void {
    resumeStore.add(name, text)
  },
  clear(): void {
    resumeStore.getAll().forEach(r => resumeStore.remove(r.id))
  },
}
