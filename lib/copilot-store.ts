import { CopilotJob, JobStatus } from '@/types/copilot-job'

const LOCAL_KEY = 'goosejobs_copilot_v1'
const SESSION_KEY = 'goosejobs_session_id'

// ── Types ─────────────────────────────────────────────────────────────────────

type NewJob = Omit<CopilotJob, 'id' | 'addedAt' | 'aiContent'>

// Raw job shape returned by /find-jobs/stream/ done event
export interface RawApiJob {
  title?: string
  company?: string
  location?: string
  salary?: string
  description?: string
  requirements?: string
  apply_url?: string
  source?: string
  relevance_score?: number
  unique_hash?: string
  [key: string]: unknown
}

// ── Local cache helpers ───────────────────────────────────────────────────────

function readLocal(): CopilotJob[] {
  if (typeof window === 'undefined') return []
  try { return JSON.parse(localStorage.getItem(LOCAL_KEY) || '[]') }
  catch { return [] }
}

function writeLocal(jobs: CopilotJob[]): void {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(jobs))
}

function getSessionId(): string | null {
  if (typeof window === 'undefined') return null
  return localStorage.getItem(SESSION_KEY)
}

// ── API helpers ───────────────────────────────────────────────────────────────

function sessionHeaders(): Record<string, string> {
  const sid = getSessionId()
  return sid ? { 'x-session-id': sid } : {}
}

async function apiPost(path: string, body: unknown) {
  return fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...sessionHeaders() },
    body: JSON.stringify(body),
  })
}

async function apiPatch(path: string, body: unknown) {
  return fetch(path, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json', ...sessionHeaders() },
    body: JSON.stringify(body),
  })
}

async function apiDelete(path: string) {
  return fetch(path, { method: 'DELETE', headers: sessionHeaders() })
}

// ── Conversion helpers ────────────────────────────────────────────────────────

function serverRowToCopilotJob(row: Record<string, unknown>): CopilotJob {
  const aiContent = (row.aiContent as CopilotJob['aiContent']) ?? {}
  return {
    id: row.id as string,
    addedAt: (row.added_at as string) ?? new Date().toISOString(),
    status: (row.status as JobStatus) ?? 'to_apply',
    title: (row.title as string) ?? 'Unknown Title',
    company: (row.company as string) ?? 'Unknown Company',
    location: (row.location as string) ?? '',
    salary: typeof row.salary === 'string' ? row.salary : '',
    description: typeof row.description === 'string' ? row.description : '',
    requirements: [],
    applyUrl: (row.apply_url as string) ?? '',
    source: ((row.source as CopilotJob['source']) ?? 'ai_search'),
    notes: '',
    favorite: typeof row.favorite === 'boolean' ? row.favorite : false,
    appliedAt: typeof row.appliedAt === 'string' ? row.appliedAt : undefined,
    followUpAt: typeof row.followUpAt === 'string' ? row.followUpAt : undefined,
    searchSessionId: typeof row.search_session_id === 'string' ? row.search_session_id : undefined,
    matchScore: typeof row.relevance_score === 'number' ? Math.round(row.relevance_score * 100) : undefined,
    aiContent,
  }
}

// ── Public store ──────────────────────────────────────────────────────────────

// Total on server (updated by hydrate/loadMore for "Load more" UX)
let _serverTotal = Infinity

export const copilotStore = {
  /** Read the local cache (synchronous, used by React renders). */
  getAll(): CopilotJob[] {
    return readLocal()
  },

  get(id: string): CopilotJob | null {
    return readLocal().find(j => j.id === id) ?? null
  },

  /** Whether there are more pages on the server beyond what's loaded locally. */
  hasMore(): boolean {
    return readLocal().length < _serverTotal
  },

  /**
   * Hydrate the local cache from the server.
   * Supports optional pagination: pass limit/offset to load a page.
   * When limit is provided, results are APPENDED (deduped) rather than replacing.
   * Returns the merged job list so callers can update React state immediately.
   */
  async hydrate(opts?: { limit?: number; offset?: number; append?: boolean }): Promise<CopilotJob[]> {
    const sid = getSessionId()
    if (!sid) return readLocal()
    try {
      const params = new URLSearchParams()
      if (opts?.limit != null) params.set('limit', String(opts.limit))
      if (opts?.offset != null) params.set('offset', String(opts.offset))
      const qs = params.toString()
      const res = await fetch(`/api/jobs${qs ? `?${qs}` : ''}`, { headers: sessionHeaders() })
      if (!res.ok) return readLocal()
      const data = await res.json() as { jobs: Record<string, unknown>[]; total?: number }
      const incoming = (data.jobs ?? []).map(serverRowToCopilotJob)
      if (data.total != null) _serverTotal = data.total

      if (opts?.append) {
        // Merge: incoming rows take precedence (fresher from server), dedup by id
        const existing = readLocal()
        const existingIds = new Set(existing.map(j => j.id))
        const merged = [...existing, ...incoming.filter(j => !existingIds.has(j.id))]
        writeLocal(merged)
        return merged
      } else {
        writeLocal(incoming)
        return incoming
      }
    } catch {
      return readLocal()
    }
  },

  /**
   * Load the next page from the server and append to the local cache.
   * Returns the merged list and whether there are still more pages.
   */
  async loadMore(pageSize = 50): Promise<{ jobs: CopilotJob[]; hasMore: boolean }> {
    const current = readLocal()
    const jobs = await this.hydrate({ limit: pageSize, offset: current.length, append: true })
    return { jobs, hasMore: jobs.length < _serverTotal }
  },

  /**
   * Save a batch of raw API jobs to the server (deduped) and merge into local cache.
   * Used after AI search completes. Returns the merged job list.
   * Pass sessionId to stamp each job with the search session that found it.
   */
  async syncFromSearch(rawJobs: RawApiJob[], sessionId?: string): Promise<CopilotJob[]> {
    // Stamp every job with the search session that produced it (stored in `data` JSON on server)
    const stamped = sessionId
      ? rawJobs.map(j => ({ ...j, search_session_id: sessionId }))
      : rawJobs
    let serverIds: string[] = []
    try {
      const res = await apiPost('/api/jobs', { jobs: stamped })
      if (res.ok) {
        const data = await res.json() as { ids: string[]; session_id: string }
        serverIds = data.ids ?? []
        if (data.session_id && typeof window !== 'undefined') {
          localStorage.setItem(SESSION_KEY, data.session_id)
        }
      }
    } catch { /* server unavailable — fall through to local fallback */ }

    if (serverIds.length > 0) {
      // Re-fetch from server to get authoritative list with server-assigned IDs
      return this.hydrate()
    }

    // Fallback: merge locally without dedup guarantee
    const existing = readLocal()
    const existingHashes = new Set(
      existing.map(j => (j as unknown as Record<string, unknown>)['unique_hash'] as string | undefined).filter(Boolean)
    )
    const toAdd: CopilotJob[] = stamped
      .filter(raw => !raw.unique_hash || !existingHashes.has(raw.unique_hash))
      .map(raw => ({
        id: crypto.randomUUID(),
        addedAt: new Date().toISOString(),
        title: raw.title ?? 'Unknown Title',
        company: raw.company ?? 'Unknown Company',
        location: raw.location ?? '',
        salary: typeof raw.salary === 'string' ? raw.salary : '',
        description: typeof raw.description === 'string' ? raw.description : '',
        requirements: [],
        applyUrl: raw.apply_url ?? '',
        source: 'ai_search' as const,
        status: 'to_apply' as JobStatus,
        notes: '',
        favorite: false,
        searchSessionId: sessionId,
        matchScore: typeof raw.relevance_score === 'number' ? Math.round(raw.relevance_score * 100) : undefined,
        aiContent: {},
      }))
    const merged = [...toAdd, ...existing]
    writeLocal(merged)
    return merged
  },

  /** Add a single job locally (for manual/URL adds). */
  add(data: NewJob): CopilotJob {
    const job: CopilotJob = {
      ...data,
      id: crypto.randomUUID(),
      addedAt: new Date().toISOString(),
      favorite: data.favorite ?? false,
      aiContent: {},
    }
    writeLocal([job, ...readLocal()])
    return job
  },

  /** Update job — write-through status, favorite, dates, and core fields to server. Notes are local-only. */
  update(id: string, updates: Partial<CopilotJob>): void {
    writeLocal(readLocal().map(j => j.id === id ? { ...j, ...updates } : j))
    const patch: Record<string, unknown> = {}
    if (updates.status !== undefined) patch.status = updates.status
    // Core + tracking fields persisted server-side (notes excluded — written on every keystroke)
    const coreFields = ['title', 'company', 'location', 'salary', 'applyUrl',
                        'favorite', 'appliedAt', 'followUpAt'] as const
    const fieldMap: Record<string, unknown> = {}
    for (const f of coreFields) {
      if (f in updates) {
        const key = f === 'applyUrl' ? 'apply_url' : f
        fieldMap[key] = updates[f as keyof CopilotJob]
      }
    }
    if (Object.keys(fieldMap).length > 0) patch.fields = fieldMap
    if (Object.keys(patch).length > 0) {
      apiPatch(`/api/jobs/${id}`, patch).catch(() => { /* best-effort */ })
    }
  },

  /** Update AI-generated content — write-through to server. */
  updateAiContent(id: string, content: Partial<CopilotJob['aiContent']>): void {
    writeLocal(readLocal().map(j =>
      j.id === id ? { ...j, aiContent: { ...j.aiContent, ...content } } : j
    ))
    apiPatch(`/api/jobs/${id}`, { ai_content: content }).catch(() => { /* best-effort */ })
  },

  /** Remove a job — write-through to server. */
  remove(id: string): void {
    writeLocal(readLocal().filter(j => j.id !== id))
    apiDelete(`/api/jobs/${id}`).catch(() => { /* best-effort */ })
  },
}
