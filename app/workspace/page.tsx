"use client"

import { useState, useEffect, useRef, useCallback, useMemo, Fragment } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, BriefcaseBusiness, Brain, Lock, MapPin, CheckSquare, Square, FileText, Mail, X, CheckCircle2, Star, Trash2, AlertTriangle, ChevronDown, ChevronLeft, Loader2, TrendingUp, Clock, Zap, Copy, Eye, Award, Target, Activity, Send, RotateCcw, LayoutGrid, List, GripVertical, Timer, Upload } from "lucide-react"
import { CopilotJob, JobStatus, STATUS_COLORS, STATUS_LABELS, getMatchTier, MATCH_TIER_COLORS } from "@/types/copilot-job"
import { copilotStore, RawApiJob as StoreRawApiJob } from "@/lib/copilot-store"
import { searchSessions, SearchSession } from "@/lib/search-sessions"
import { masterResume } from "@/lib/master-resume"
import { resumeStore, type StoredResume } from "@/lib/resume-store"
import { session as sessionStore } from "@/lib/session"
import { useSearch } from "@/components/search-provider"
import { JobCopilotPanel } from "@/components/job-copilot-panel"
import { AddJobModal } from "@/components/add-job-modal"
import { DashboardSidebar, MobileBottomNav, ViewType } from "@/components/dashboard-sidebar"
import { AiSearchLoader } from "@/components/ai-search-loader"
import { JobBoardToolbar, BoardFilters, DEFAULT_FILTERS, applyFilters, SearchSessionSummary, SortKey } from "@/components/job-board-toolbar"
import { QuickApplyModal } from "@/components/quick-apply-modal"
import { ShortcutsHelp } from "@/components/shortcuts-help"
import { SettingsPanel } from "@/components/settings-panel"
import { DigestNudge } from "@/components/digest-nudge"
import { DiscoverPanel } from "@/components/discover-panel"
import { PipelineChart } from "@/components/pipeline-chart"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"

type NewJob = Omit<CopilotJob, 'id' | 'addedAt' | 'aiContent'>
type RawApiJob = StoreRawApiJob

interface LocationOption {
  label: string
  country_code: string | null
  remote: boolean
}

// ── Helpers ───────────────────────────────────────────────────────────────────

/** Semantic match-tier indicator: tier label + thin score bar */
function MatchTierBadge({ score }: { score: number }) {
  const { label, tier } = getMatchTier(score)
  const colors = MATCH_TIER_COLORS[tier]
  return (
    <div className="flex flex-col items-end gap-1 shrink-0">
      <span className={cn(
        'text-[10px] font-semibold px-1.5 py-0.5 rounded border leading-none whitespace-nowrap',
        colors.text, colors.bg, colors.border,
      )}>
        {label}
      </span>
      {/* Thin score bar */}
      <div className="w-10 h-1 rounded-full bg-paper-2 overflow-hidden">
        <div
          className={cn("h-full rounded-full transition-all", colors.bar)}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>
    </div>
  )
}

/** Company initial avatar */
function CompanyAvatar({ company }: { company: string }) {
  const initial = company.replace(/^the\s+/i, '').trim()[0]?.toUpperCase() || '?'
  return (
    <div className="h-7 w-7 rounded bg-paper-2 border border-line flex items-center justify-center shrink-0">
      <span className="text-[11px] font-bold text-stone">{initial}</span>
    </div>
  )
}

// ── Stage funnel header ───────────────────────────────────────────────────────

const FUNNEL_STAGES = [
  { status: 'to_apply'  as JobStatus, label: 'Saved',     barClass: 'bg-stone/50',    numClass: 'text-ink-soft'    },
  { status: 'applied'   as JobStatus, label: 'Applied',   barClass: 'bg-brand-500',   numClass: 'text-brand-600'   },
  { status: 'interview' as JobStatus, label: 'Interview', barClass: 'bg-amber-400',   numClass: 'text-amber-600'   },
  { status: 'offer'     as JobStatus, label: 'Offer',     barClass: 'bg-emerald-500', numClass: 'text-emerald-600' },
]

function StageFunnelHeader({
  jobs,
  activeStatus,
  onStageClick,
  onFindJobs,
  isSearchRunning,
}: {
  jobs: CopilotJob[]
  activeStatus: JobStatus | 'all'
  onStageClick: (s: JobStatus | 'all') => void
  onFindJobs: () => void
  isSearchRunning: boolean
}) {
  const counts = FUNNEL_STAGES.map(s => jobs.filter(j => j.status === s.status).length)
  const max = Math.max(...counts, 1)

  return (
    <div className="shrink-0 border-b bg-card flex items-stretch h-[52px]">
      {FUNNEL_STAGES.map((stage, i) => {
        const count = counts[i]
        const isActive = activeStatus === stage.status

        return (
          <Fragment key={stage.status}>
            <button
              onClick={() => onStageClick(isActive ? 'all' : stage.status)}
              aria-pressed={isActive}
              aria-label={`${stage.label}: ${count} jobs`}
              className={cn(
                "flex-1 flex flex-col items-center justify-center px-2 relative transition-colors group overflow-hidden",
                "border-b-2",
                isActive
                  ? "border-brand-500 bg-brand-50/30"
                  : "border-transparent hover:bg-paper-2/50",
              )}
            >
              <div className="flex items-baseline gap-1.5 relative z-10">
                <span className={cn(
                  "text-[17px] font-bold tabular-nums leading-none transition-colors",
                  isActive ? stage.numClass : count > 0 ? "text-ink" : "text-stone/30",
                )}>
                  {count}
                </span>
                <span className={cn(
                  "text-[10px] font-semibold uppercase tracking-wide transition-colors",
                  isActive ? "text-ink-soft" : "text-stone/55",
                )}>
                  {stage.label}
                </span>
              </div>
              {/* Proportional fill bar at bottom */}
              <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-paper-2">
                <div
                  className={cn("h-full transition-all duration-500", stage.barClass, "opacity-60")}
                  style={{ width: `${(count / max) * 100}%` }}
                />
              </div>
            </button>

            {i < FUNNEL_STAGES.length - 1 && (
              <div className="flex items-center justify-center w-5 shrink-0 text-[10px] text-stone/25 font-mono select-none">
                →
              </div>
            )}
          </Fragment>
        )
      })}

      {/* Find jobs CTA */}
      <div className="flex items-center border-l border-line px-3 shrink-0">
        <button
          disabled={isSearchRunning}
          onClick={onFindJobs}
          aria-label={isSearchRunning ? 'Search in progress' : 'Find jobs with AI'}
          className={cn(
            "flex items-center gap-1.5 px-3 h-7 rounded-md text-[12px] font-semibold transition-all",
            isSearchRunning
              ? "bg-brand-50 border border-brand-200 text-brand-400 cursor-not-allowed"
              : "bg-brand-600 hover:bg-brand-700 text-white",
          )}
        >
          <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
          <span className="hidden sm:inline">{isSearchRunning ? 'Searching…' : 'Find jobs'}</span>
        </button>
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function WorkspacePage() {
  const [currentView, setCurrentView] = useState<ViewType>('jobs')
  const [jobs, setJobs] = useState<CopilotJob[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)

  const [resumeFile, setResumeFile] = useState<File | null>(null)
  // Lazy initializer: reads from localStorage immediately — eliminates NoResumeBanner flash on returning visits
  const [isDemoMode, setIsDemoMode] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem('gj_demo_mode') === 'true'
  })

  const [masterResumeText, setMasterResumeText] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return masterResume.get()
  })
  const [allResumes, setAllResumes] = useState<StoredResume[]>(() => {
    if (typeof window === 'undefined') return []
    return resumeStore.getAll()
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resumeOnlyRef = useRef<HTMLInputElement>(null)

  // Location selector state
  const [availableLocations, setAvailableLocations] = useState<LocationOption[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null)
  const [editingLocation, setEditingLocation] = useState(false)

  // Hydration state — show localStorage jobs instantly, skeleton while server syncs
  const [isHydrating, setIsHydrating] = useState(true)

  // Auth check — prevents workspace from flashing before onboarding redirect
  const [authChecked, setAuthChecked] = useState(false)

  // Mass selection state
  const [selectionMode, setSelectionMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set())
  const [bulkProgress, setBulkProgress] = useState<{ current: number; total: number; type: string } | null>(null)
  const [bulkDone, setBulkDone] = useState<{ count: number; type: string } | null>(null)

  // Board toolbar / filter state
  const [boardFilters, setBoardFilters] = useState<BoardFilters>(DEFAULT_FILTERS)
  const searchInputRef = useRef<HTMLInputElement | null>(null)

  // Quick-apply modal state
  const [showQuickApply, setShowQuickApply] = useState(false)

  // Keyboard shortcuts help
  const [showShortcutsHelp, setShowShortcutsHelp] = useState(false)

  // Load-more pagination
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(false)

  // Resumes view state
  const [previewJob, setPreviewJob] = useState<CopilotJob | null>(null)
  const [previewType, setPreviewType] = useState<'coverLetter' | 'tailoredResume'>('coverLetter')
  const [copiedKey, setCopiedKey] = useState<string | null>(null)

  // Search session history (read from localStorage on mount, updated after each search)
  const [sessions, setSessions] = useState<SearchSession[]>([])

  // Applications view filter/sort state
  const [appSearch, setAppSearch] = useState('')
  const [appSort, setAppSort] = useState<SortKey>('newest')
  const [appFavOnly, setAppFavOnly] = useState(false)
  const [appViewMode, setAppViewMode] = useState<'list' | 'kanban'>('list')

  // Kanban drag state
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [dragOverStatus, setDragOverStatus] = useState<string | null>(null)

  // Weekly goal (from localStorage)
  const [weeklyGoal, setWeeklyGoal] = useState<number>(10)

  // Global search state from provider
  const { status, mode, logs, jobCount, error, firstJobId, startSearch, goBackground, dismiss } = useSearch()
  const isSearchRunning = status !== 'idle'
  const showOverlay = mode === 'overlay' && status !== 'idle'

  // ── Bootstrap ──────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!localStorage.getItem('gj_onboarded')) {
      window.location.href = '/onboarding'
      return
    }
    setAuthChecked(true)

    // Load search session history
    setSessions(searchSessions.getAll())

    // Load weekly goal
    try { const g = localStorage.getItem('gj_weekly_goal'); if (g) setWeeklyGoal(Number(g)) } catch { /* ignore */ }

    // Show localStorage jobs immediately — eliminates the blank flash on refresh
    const stored = copilotStore.getAll()
    if (stored.length > 0) {
      setJobs(stored)
      setSelectedId(stored[0].id)
    }

    // Pick up jobs from onboarding run
    const onboardingJobsRaw = localStorage.getItem('gj_onboarding_jobs')
    if (onboardingJobsRaw) {
      localStorage.removeItem('gj_onboarding_jobs')
      try {
        const rawJobs: RawApiJob[] = JSON.parse(onboardingJobsRaw)
        copilotStore.syncFromSearch(rawJobs).then(all => {
          setJobs(all)
          if (all.length > 0) setSelectedId(all[0].id)
          setIsHydrating(false)
        })
      } catch {
        setIsHydrating(false)
      }
    } else if (localStorage.getItem('gj_demo_mode') === 'true') {
      // Demo mode: use pre-seeded localStorage data — no server sync
      const stored = copilotStore.getAll()
      if (stored.length > 0) {
        setJobs(stored)
        setSelectedId(stored[0].id)
      }
      setHasMore(false)
      setIsHydrating(false)
    } else {
      // Server hydrate — first page of 50 for fast load, load more on demand
      copilotStore.hydrate({ limit: 50, offset: 0 }).then(hydratedJobs => {
        if (hydratedJobs.length > 0) {
          setJobs(hydratedJobs)
          setSelectedId(prev => prev ?? hydratedJobs[0].id)
        }
        setHasMore(copilotStore.hasMore())
        setIsHydrating(false)
      }).catch(() => setIsHydrating(false))
    }

    // Load supported locations + default from onboarding prefs
    fetch('/api/supported-locations')
      .then(r => r.ok ? r.json() as Promise<LocationOption[]> : Promise.resolve([]))
      .then(locs => {
        setAvailableLocations(locs)
        try {
          // Prefer last manually chosen location over onboarding default
          const lastLoc = localStorage.getItem('gj_last_location')
          if (lastLoc) {
            const match = locs.find(l => (l.country_code ?? 'remote') === lastLoc)
            if (match) { setSelectedLocation(match); return }
          }
          const prefs = JSON.parse(localStorage.getItem('gj_onboarded') || '{}')
          if (prefs.workStyle === 'remote') {
            const remoteOpt = locs.find(l => l.remote)
            if (remoteOpt) { setSelectedLocation(remoteOpt); return }
          }
          if (prefs.country_code) {
            const match = locs.find(l => l.country_code === prefs.country_code)
            if (match) { setSelectedLocation(match); return }
          }
          setSelectedLocation(locs.find(l => !l.remote) ?? locs[0] ?? null)
        } catch { /* ignore */ }
      })
      .catch(() => {})

    // If localStorage had no resume, try fetching from server
    if (!masterResume.get()) {
      const sid = sessionStore.getId()
      if (sid) {
        fetch('/api/resume', { headers: { 'x-session-id': sid } })
          .then(r => r.ok ? r.json() : null)
          .then(d => {
            if (d?.resume_text) {
              masterResume.set(d.resume_text)
              setMasterResumeText(d.resume_text)
              setAllResumes(resumeStore.getAll())
            }
          })
          .catch(() => {})
      }
    }
  }, [])

  // When overlay search completes, refresh job list + session history
  useEffect(() => {
    if (status === 'done' && mode === 'overlay') {
      setJobs(copilotStore.getAll())
      setSessions(searchSessions.getAll())
      if (firstJobId) setSelectedId(firstJobId)
    }
  }, [status, mode, firstJobId])

  // Background search: listen for completion event to refresh jobs + switch view
  useEffect(() => {
    const onSearchDone = (e: Event) => {
      const { firstJobId: fid } = (e as CustomEvent<{ firstJobId: string | null; count: number }>).detail
      setJobs(copilotStore.getAll())
      setSessions(searchSessions.getAll())
      if (fid) setSelectedId(fid)
    }
    const onViewJobs = (e: Event) => {
      const { firstJobId: fid } = (e as CustomEvent<{ firstJobId: string | null }>).detail
      setCurrentView('jobs')
      if (fid) setSelectedId(fid)
    }
    window.addEventListener('goosejobs:search-done', onSearchDone)
    window.addEventListener('goosejobs:view-jobs', onViewJobs)
    return () => {
      window.removeEventListener('goosejobs:search-done', onSearchDone)
      window.removeEventListener('goosejobs:view-jobs', onViewJobs)
    }
  }, [])

  // When user navigates away while an overlay search is running, push it to background
  // so the stream keeps going and the status pill appears instead of the overlay vanishing
  useEffect(() => {
    if (currentView !== 'jobs' && mode === 'overlay' && status === 'running') {
      goBackground()
    }
  }, [currentView]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Job actions ───────────────────────────────────────────────────────────

  const selectedJob = jobs.find(j => j.id === selectedId) ?? null
  const refreshJobs = () => setJobs(copilotStore.getAll())

  const handleAdd = (data: NewJob) => {
    const job = copilotStore.add(data)
    refreshJobs()
    setSelectedId(job.id)
    setCurrentView('jobs')
    setShowAddModal(false)
  }

  /** Called when URL import succeeds — persists via syncFromSearch then selects the new job. */
  const handleUrlImport = useCallback(async (rawJob: RawApiJob) => {
    const updated = await copilotStore.syncFromSearch([rawJob])
    setJobs(updated)
    // The newest job is first (server returns desc by added_at)
    if (updated.length > 0) setSelectedId(updated[0].id)
    setCurrentView('jobs')
    setShowAddModal(false)
  }, [])

  const handleUpdate = (updates: Partial<CopilotJob>) => {
    if (!selectedJob) return
    copilotStore.update(selectedJob.id, updates)
    refreshJobs()
  }

  const handleRemove = () => {
    if (!selectedJob) return
    copilotStore.remove(selectedJob.id)
    const remaining = copilotStore.getAll()
    setJobs(remaining)
    setSelectedId(remaining.length > 0 ? remaining[0].id : null)
  }

  // ── AI search ─────────────────────────────────────────────────────────────

  const handleAiSearch = useCallback(async (file: File) => {
    setResumeFile(file)

    // Resume upload: session management + master resume text (non-blocking)
    const sessionHeaders = sessionStore.getHeaders()
    const resumeFormData = new FormData()
    resumeFormData.append('resume_file', file)
    fetch('/api/resume', { method: 'POST', headers: sessionHeaders, body: resumeFormData })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.resume_text) {
          masterResume.set(d.resume_text, file.name)
          setMasterResumeText(d.resume_text)
          setAllResumes(resumeStore.getAll())
        }
        if (d?.session_id) sessionStore.setId(d.session_id)
      })
      .catch(() => {})

    // Start global streaming search
    startSearch(file, selectedLocation)
  }, [selectedLocation, startSearch])

  const handleLoaderDone = useCallback(() => {
    const fid = firstJobId  // capture before dismiss clears it
    dismiss()
    setCurrentView('jobs')
    if (fid) setSelectedId(fid)
    setJobs(copilotStore.getAll())
  }, [dismiss, firstJobId])

  const handleDismissError = useCallback(() => {
    dismiss()
  }, [dismiss])

  // Upload resume only (no AI search) — used by the NoResumeBanner button in the copilot panel
  const handleResumeOnlyUpload = useCallback(async (file: File) => {
    setResumeFile(file)
    const sessionHeaders = sessionStore.getHeaders()
    const fd = new FormData()
    fd.append('resume_file', file)
    fetch('/api/resume', { method: 'POST', headers: sessionHeaders, body: fd })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.resume_text) {
          masterResume.set(d.resume_text, file.name)
          setMasterResumeText(d.resume_text)
          setAllResumes(resumeStore.getAll())
        }
        if (d?.session_id) sessionStore.setId(d.session_id)
      })
      .catch(() => {})
  }, [])

  const handleSetActiveResume = useCallback((id: string) => {
    resumeStore.setActive(id)
    const active = resumeStore.getActive()
    setMasterResumeText(active?.text ?? null)
    setAllResumes(resumeStore.getAll())
  }, [])

  const handleDeleteResume = useCallback((id: string) => {
    resumeStore.remove(id)
    const active = resumeStore.getActive()
    setMasterResumeText(active?.text ?? null)
    setAllResumes(resumeStore.getAll())
  }, [])

  // ── Bulk generation ────────────────────────────────────────────────────────

  const handleBulkGenerate = useCallback(async (type: 'cover-letter' | 'resume' | 'both') => {
    if (!masterResumeText) return
    const targets = jobs.filter(j => selectedIds.has(j.id))
    if (targets.length === 0) return

    const label = type === 'cover-letter' ? 'Cover Letters' : type === 'resume' ? 'Resumes' : 'Cover Letters & Resumes'
    setBulkProgress({ current: 0, total: targets.length, type: label })
    setBulkDone(null)

    for (let i = 0; i < targets.length; i++) {
      const job = targets[i]
      setBulkProgress({ current: i + 1, total: targets.length, type: label })
      const body = {
        resume_text: masterResumeText,
        job_description: job.description,
        job_title: job.title,
        company: job.company,
        relevance_score: job.matchScore ?? 50,
      }
      try {
        if (type === 'cover-letter' || type === 'both') {
          const r = await fetch('/api/generate/cover-letter/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          if (r.ok) {
            const d = await r.json() as { cover_letter?: string }
            if (d.cover_letter) copilotStore.updateAiContent(job.id, { coverLetter: d.cover_letter })
          }
        }
        if (type === 'resume' || type === 'both') {
          const r = await fetch('/api/generate/tailored-resume/', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          })
          if (r.ok) {
            const d = await r.json() as { suggestions?: string }
            if (d.suggestions) copilotStore.updateAiContent(job.id, { tailoredResume: d.suggestions })
          }
        }
      } catch { /* skip failed job, continue */ }
    }

    refreshJobs()
    setBulkProgress(null)
    setBulkDone({ count: targets.length, type: label })
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [jobs, selectedIds, masterResumeText])

  // ── Filtered + sorted job list for board ─────────────────────────────────

  const visibleJobs = useMemo(() => applyFilters(jobs, boardFilters), [jobs, boardFilters])

  const filteredAppJobs = useMemo(() => applyFilters(jobs, {
    ...DEFAULT_FILTERS,
    search: appSearch,
    sort: appSort,
    favoritesOnly: appFavOnly,
  }), [jobs, appSearch, appSort, appFavOnly])

  // Load more from server
  const handleLoadMore = useCallback(async () => {
    setLoadingMore(true)
    const { jobs: merged, hasMore: more } = await copilotStore.loadMore(50)
    setJobs(merged)
    setHasMore(more)
    setLoadingMore(false)
  }, [])

  // Bulk status change
  const handleBulkStatus = useCallback(async (status: JobStatus) => {
    const appliedAt = status === 'applied' ? new Date().toISOString() : undefined
    selectedIds.forEach(id => {
      copilotStore.update(id, { status, ...(appliedAt ? { appliedAt } : {}) })
    })
    refreshJobs()
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [selectedIds]) // eslint-disable-line react-hooks/exhaustive-deps

  // Bulk favorite / unfavorite
  const handleBulkFavorite = useCallback((favorite: boolean) => {
    selectedIds.forEach(id => copilotStore.update(id, { favorite }))
    refreshJobs()
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [selectedIds])

  // Bulk delete
  const handleBulkDelete = useCallback(() => {
    if (!confirm(`Delete ${selectedIds.size} job${selectedIds.size !== 1 ? 's' : ''}? This cannot be undone.`)) return
    selectedIds.forEach(id => copilotStore.remove(id))
    const remaining = copilotStore.getAll()
    setJobs(remaining)
    setSelectedId(remaining.length > 0 ? remaining[0].id : null)
    setSelectedIds(new Set())
    setSelectionMode(false)
  }, [selectedIds])

  // Quick-apply: feed to_apply jobs sorted by match score
  const quickApplyQueue = useMemo(
    () => visibleJobs.filter(j => j.status === 'to_apply').sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0)),
    [visibleJobs]
  )

  // Keyboard shortcuts (active in jobs view, ignored when typing in inputs)
  useEffect(() => {
    if (currentView !== 'jobs') return
    const handler = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName?.toLowerCase()
      const editable = (e.target as HTMLElement)?.isContentEditable
      if (['input', 'textarea', 'select'].includes(tag) || editable) return

      const idx = selectedId ? visibleJobs.findIndex(j => j.id === selectedId) : -1

      switch (e.key) {
        case 'j': {
          e.preventDefault()
          const next = visibleJobs[idx + 1]
          if (next) setSelectedId(next.id)
          break
        }
        case 'k': {
          e.preventDefault()
          const prev = visibleJobs[idx - 1]
          if (prev) setSelectedId(prev.id)
          break
        }
        case 'f': {
          e.preventDefault()
          const job = visibleJobs[idx]
          if (job) { copilotStore.update(job.id, { favorite: !job.favorite }); refreshJobs() }
          break
        }
        case 'a': {
          e.preventDefault()
          const job = visibleJobs[idx]
          if (job) { copilotStore.update(job.id, { status: 'applied', appliedAt: new Date().toISOString() }); refreshJobs() }
          break
        }
        case 'o': {
          e.preventDefault()
          const job = visibleJobs[idx]
          if (job?.applyUrl) window.open(job.applyUrl, '_blank')
          break
        }
        case 'x': {
          e.preventDefault()
          const job = visibleJobs[idx]
          if (!job) break
          if (!selectionMode) setSelectionMode(true)
          setSelectedIds(prev => {
            const next = new Set(prev)
            if (next.has(job.id)) next.delete(job.id)
            else next.add(job.id)
            return next
          })
          break
        }
        case '/': {
          e.preventDefault()
          searchInputRef.current?.focus()
          break
        }
        case 'Escape': {
          if (boardFilters.search) {
            setBoardFilters(f => ({ ...f, search: '' }))
          } else if (selectionMode) {
            setSelectionMode(false)
            setSelectedIds(new Set())
          }
          break
        }
        case '?': {
          e.preventDefault()
          setShowShortcutsHelp(h => !h)
          break
        }
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [currentView, visibleJobs, selectedId, selectionMode, boardFilters.search]) // eslint-disable-line react-hooks/exhaustive-deps

  // Stats derived from copilotStore for Dashboard / Applications
  const today = new Date().toISOString().slice(0, 10)
  const toApplyCount    = jobs.filter(j => j.status === 'to_apply').length
  const appliedCount    = jobs.filter(j => j.status === 'applied').length
  const interviewCount  = jobs.filter(j => j.status === 'interview').length
  const offerCount      = jobs.filter(j => j.status === 'offer').length
  const rejectedCount   = jobs.filter(j => j.status === 'rejected').length
  const ghostedCount    = jobs.filter(j => j.status === 'ghosted').length
  const followUpsDue    = jobs.filter(j => j.followUpAt && j.followUpAt <= today && ['applied', 'interview'].includes(j.status)).length

  // Dashboard computed extras
  const appliedToday    = jobs.filter(j => j.appliedAt?.slice(0, 10) === today).length
  const weekAgo         = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  const appliedThisWeek = jobs.filter(j => j.appliedAt && j.appliedAt.slice(0, 10) >= weekAgo).length
  const favoritesUnread = jobs.filter(j => j.favorite && j.status === 'to_apply').length
  const aiReadyCount    = jobs.filter(j => j.aiContent?.coverLetter || j.aiContent?.tailoredResume).length
  const recentApplied   = [...jobs]
    .filter(j => j.appliedAt)
    .sort((a, b) => (b.appliedAt ?? '').localeCompare(a.appliedAt ?? ''))
    .slice(0, 8)
  const followUpJobs    = jobs.filter(j => j.followUpAt && j.followUpAt <= today && ['applied', 'interview'].includes(j.status))

  if (!authChecked) return null

  return (
    <div className="h-screen flex overflow-hidden bg-paper">

      {/* Left nav sidebar — hidden on mobile (replaced by bottom nav) */}
      <div className="hidden md:flex h-full">
        <DashboardSidebar
          currentView={currentView}
          onViewChange={setCurrentView}
          favoriteJobs={jobs.filter(j => j.favorite).map(j => ({ id: j.id, title: j.title, company: j.company }))}
          onJobClick={id => { setSelectedId(id); setCurrentView('jobs') }}
          navBadges={{
            jobs: jobs.length > 0 ? { count: jobs.length } : undefined,
            applications: followUpsDue > 0
              ? { count: followUpsDue, urgent: true }
              : toApplyCount > 0 ? { count: toApplyCount } : undefined,
          }}
          onShowShortcuts={() => setShowShortcutsHelp(true)}
        />
      </div>

      {/* Content area */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Demo mode banner */}
        {isDemoMode && (
          <div className="shrink-0 flex items-center justify-between gap-3 px-4 py-2 bg-brand-50 border-b border-brand-100 text-[12px]">
            <div className="flex items-center gap-2 min-w-0">
              <span className="fg-label text-brand-600 shrink-0">Demo</span>
              <span className="text-stone truncate">Sample data loaded · 15 pre-ranked jobs · AI content included</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a
                href="/"
                onClick={() => {
                  localStorage.removeItem('gj_demo_mode')
                  localStorage.removeItem('gj_onboarded')
                  localStorage.removeItem('goosejobs_copilot_v1')
                  localStorage.removeItem('goosejobs_resumes_v1')
                  localStorage.removeItem('gj_weekly_goal')
                }}
                className="text-brand-600 hover:text-brand-800 font-semibold"
              >
                Start for real →
              </a>
              <button
                onClick={() => setIsDemoMode(false)}
                aria-label="Dismiss demo banner"
                className="text-stone hover:text-ink-soft"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* ── MY JOBS workspace ─────────────────────────────────────────── */}
        {currentView === 'jobs' && (
          <div className="flex flex-1 flex-col overflow-hidden">

          {/* Stage funnel — spans full content width, primary pipeline navigation */}
          <StageFunnelHeader
            jobs={jobs}
            activeStatus={boardFilters.status as JobStatus | 'all'}
            onStageClick={s => setBoardFilters(f => ({ ...f, status: s }))}
            onFindJobs={() => fileInputRef.current?.click()}
            isSearchRunning={isSearchRunning}
          />

          {/* Digest nudge — compact banner, dismissed for 7 days on ×, hidden when digest is active */}
          <DigestNudge
            compact
            jobCount={jobs.length}
            onNavigateToSettings={() => setCurrentView('settings')}
          />

          <div className="flex flex-1 overflow-hidden">

            {/* Job list sidebar — full-width on mobile, fixed 256 on desktop; hidden on mobile when a job is open */}
            <aside className={cn(
              "border-r flex-col shrink-0 bg-paper-2/50",
              "w-full md:w-64",
              selectedId ? "hidden md:flex" : "flex",
            )}>

              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b bg-card">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-stone uppercase tracking-wider">Jobs</span>
                  {jobs.length > 0 && (
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-paper-2 text-stone tabular-nums">
                      {boardFilters.search || boardFilters.status !== 'all' || boardFilters.favoritesOnly
                        ? `${visibleJobs.length}/${jobs.length}`
                        : jobs.length}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1">
                  {jobs.length > 0 && (
                    <Button
                      size="icon"
                      variant="ghost"
                      aria-label={selectionMode ? "Exit selection mode" : "Select jobs for bulk actions"}
                      aria-pressed={selectionMode}
                      title={selectionMode ? "Exit selection (Esc)" : "Select multiple (x)"}
                      className={cn("h-6 w-6", selectionMode ? "text-brand-600 bg-brand-50" : "text-stone hover:text-ink-soft")}
                      onClick={() => { setSelectionMode(m => !m); setSelectedIds(new Set()) }}
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Add job"
                    className="h-6 w-6 text-stone hover:text-ink-soft"
                    onClick={() => setShowAddModal(true)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>

              {/* Board toolbar (search / filter / sort / quick-apply) */}
              {jobs.length > 0 && (
                <JobBoardToolbar
                  filters={boardFilters}
                  onChange={setBoardFilters}
                  totalJobs={jobs.length}
                  visibleCount={visibleJobs.length}
                  onStartApplying={quickApplyQueue.length > 0 ? () => setShowQuickApply(true) : undefined}
                  searchInputRef={searchInputRef}
                  sessions={sessions as SearchSessionSummary[]}
                />
              )}

              {/* Pipeline mini-stats — fills the left panel, gives at-a-glance stage counts */}
              {jobs.length > 0 && (
                <div className="border-b border-line bg-paper-2/60 px-3 py-1.5 flex items-center gap-x-3 flex-wrap shrink-0">
                  <span className="text-[10px] font-semibold text-stone/40 uppercase tracking-wide">Pipeline</span>
                  {toApplyCount > 0 && (
                    <span className="text-[11px] text-stone/70">
                      <b className="font-bold text-ink-soft tabular-nums">{toApplyCount}</b> saved
                    </span>
                  )}
                  {appliedCount > 0 && (
                    <span className="text-[11px] text-stone/70">
                      <b className="font-bold text-brand-600 tabular-nums">{appliedCount}</b> applied
                    </span>
                  )}
                  {interviewCount > 0 && (
                    <span className="text-[11px] text-stone/70">
                      <b className="font-bold text-amber-600 tabular-nums">{interviewCount}</b> interview
                    </span>
                  )}
                  {offerCount > 0 && (
                    <span className="text-[11px] text-stone/70">
                      <b className="font-bold text-emerald-600 tabular-nums">{offerCount}</b> offer
                    </span>
                  )}
                  {followUpsDue > 0 && (
                    <span className="text-[11px] font-medium text-amber-600 ml-auto">
                      ⏰ {followUpsDue} follow-up{followUpsDue !== 1 ? 's' : ''} due
                    </span>
                  )}
                </div>
              )}

              {/* Job list */}
              <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
                {isHydrating && jobs.length === 0 ? (
                  <div className="p-3 space-y-2" aria-label="Loading jobs" role="status">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="px-3 py-2.5 border-b border-line animate-pulse">
                        <div className="flex items-start gap-2">
                          <div className="h-7 w-7 rounded-md bg-paper-2 shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-3/4 bg-paper-2 rounded" />
                            <div className="h-2.5 w-1/2 bg-paper-2 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="p-5 text-center mt-6">
                    <BriefcaseBusiness className="h-8 w-8 mx-auto text-stone/30 mb-3" aria-hidden />
                    <p className="text-sm font-semibold text-ink-soft">No jobs yet</p>
                    <p className="text-[13px] text-stone mt-1 leading-relaxed">Add one manually or let the goose hunt.</p>
                    <Button size="sm" variant="outline" className="mt-4 gap-1.5 h-7 text-[12px]" onClick={() => setShowAddModal(true)}>
                      <Plus className="h-3 w-3" /> Add first job
                    </Button>
                  </div>
                ) : visibleJobs.length === 0 ? (
                  <div className="p-5 text-center mt-4">
                    <p className="text-[13px] text-stone">No jobs match your filters.</p>
                    <button
                      className="mt-2 text-[12px] text-brand-600 hover:text-brand-700 underline"
                      onClick={() => setBoardFilters(DEFAULT_FILTERS)}
                    >
                      Clear filters
                    </button>
                  </div>
                ) : (
                  <>
                    {visibleJobs.map(job => {
                      const isSelected = selectedId === job.id
                      const isChecked = selectedIds.has(job.id)
                      const followUpOverdue = job.followUpAt && job.followUpAt <= today
                      return (
                        /* content-visibility: off-screen cards skip layout/paint */
                        <div
                          key={job.id}
                          style={{ contentVisibility: 'auto', containIntrinsicSize: '0 56px' }}
                        >
                          {/* div+role instead of <button> so we can nest the star button inside */}
                          <div
                            role="button"
                            tabIndex={0}
                            onClick={() => {
                              if (selectionMode) {
                                setSelectedIds(prev => {
                                  const next = new Set(prev)
                                  if (next.has(job.id)) next.delete(job.id)
                                  else next.add(job.id)
                                  return next
                                })
                              } else {
                                setSelectedId(job.id)
                              }
                            }}
                            onKeyDown={e => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                setSelectedId(job.id)
                              }
                            }}
                            aria-pressed={selectionMode ? isChecked : isSelected}
                            aria-label={`${job.title} at ${job.company}`}
                            className={cn(
                              "w-full text-left px-3 py-2.5 transition-colors border-b border-line last:border-0 cursor-pointer",
                              "hover:bg-card focus-visible:outline-none focus-visible:bg-brand-50/40",
                              selectionMode
                                ? isChecked
                                  ? "bg-brand-50/60 border-l-2 border-l-brand-400 pl-[10px]"
                                  : "border-l-2 border-l-transparent"
                                : isSelected
                                  ? "bg-card border-l-2 border-l-brand-500 pl-[10px]"
                                  : "border-l-2 border-l-transparent",
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {selectionMode ? (
                                <div className="h-7 w-7 flex items-center justify-center shrink-0">
                                  {isChecked ? <CheckSquare className="h-4 w-4 text-brand-600" /> : <Square className="h-4 w-4 text-stone/50" />}
                                </div>
                              ) : (
                                <CompanyAvatar company={job.company} />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold truncate leading-snug text-ink">{job.title}</p>
                                <p className="text-[12px] text-stone truncate mt-0.5">{job.company}</p>
                                {job.location && job.location !== 'Not specified' && (
                                  <p className="text-[11px] text-stone truncate mt-0.5">{job.location}</p>
                                )}
                                {followUpOverdue && (
                                  <p className="text-[10px] text-amber-600 font-medium mt-0.5">⏰ Follow-up due</p>
                                )}
                              </div>
                              {!selectionMode && (
                                <div className="flex flex-col items-end gap-1 shrink-0 mt-0.5">
                                  {/* Favorite star — valid here because parent is div, not button */}
                                  <button
                                    aria-label={job.favorite ? 'Unfavorite' : 'Favorite'}
                                    aria-pressed={job.favorite}
                                    onClick={e => {
                                      e.stopPropagation()
                                      copilotStore.update(job.id, { favorite: !job.favorite })
                                      refreshJobs()
                                    }}
                                    className={cn(
                                      "p-0.5 rounded transition-colors",
                                      job.favorite ? "text-amber-400" : "text-stone/30 hover:text-amber-400",
                                    )}
                                  >
                                    <Star className={cn("h-3 w-3", job.favorite && "fill-amber-400")} />
                                  </button>
                                  {job.matchScore !== undefined && <MatchTierBadge score={job.matchScore} />}
                                  <span aria-label={`Status: ${job.status}`} className={cn("h-1.5 w-1.5 rounded-full shrink-0 mt-0.5", STATUS_COLORS[job.status])} />
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      )
                    })}

                    {/* Load more */}
                    {hasMore && (
                      <div className="p-3 flex justify-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 text-[12px] gap-1.5 text-stone"
                          onClick={handleLoadMore}
                          disabled={loadingMore}
                        >
                          {loadingMore
                            ? <><Loader2 className="h-3 w-3 animate-spin" /> Loading…</>
                            : <><ChevronDown className="h-3 w-3" /> Load more</>
                          }
                        </Button>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Bulk action bar — visible when in selection mode */}
              {selectionMode && (
                <div className="border-t bg-brand-50/60 px-3 py-2.5 shrink-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-brand-700">
                      {selectedIds.size === 0 ? 'Select jobs above' : `${selectedIds.size} selected`}
                    </span>
                    {selectedIds.size > 0 && (
                      <button
                        className="text-[11px] text-stone hover:text-ink-soft underline"
                        onClick={() => setSelectedIds(new Set(visibleJobs.map(j => j.id)))}
                      >
                        Select all
                      </button>
                    )}
                  </div>
                  {selectedIds.size > 0 && (
                    <div className="space-y-1.5">
                      {/* AI generation */}
                      <div className="flex gap-1.5 flex-wrap">
                        {!masterResumeText && (
                          <p className="text-[11px] text-amber-600 w-full">Upload resume first to generate.</p>
                        )}
                        <Button size="sm" disabled={!masterResumeText || !!bulkProgress} className="h-7 text-[11px] px-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md gap-1" onClick={() => handleBulkGenerate('cover-letter')}>
                          <Mail className="h-3 w-3" /> Cover Letters
                        </Button>
                        <Button size="sm" disabled={!masterResumeText || !!bulkProgress} className="h-7 text-[11px] px-2 bg-brand-600 hover:bg-brand-700 text-white rounded-md gap-1" onClick={() => handleBulkGenerate('resume')}>
                          <FileText className="h-3 w-3" /> Resumes
                        </Button>
                        <Button size="sm" disabled={!masterResumeText || !!bulkProgress} variant="outline" className="h-7 text-[11px] px-2 rounded-md" onClick={() => handleBulkGenerate('both')}>Both</Button>
                      </div>
                      {/* Tracking actions */}
                      <div className="flex gap-1.5 flex-wrap pt-1 border-t border-brand-100">
                        {/* Bulk status */}
                        <Select onValueChange={v => handleBulkStatus(v as JobStatus)}>
                          <SelectTrigger className="h-7 text-[11px] w-28 px-2">
                            <SelectValue placeholder="Set status…" />
                          </SelectTrigger>
                          <SelectContent>
                            {(Object.entries(STATUS_LABELS) as [JobStatus, string][]).map(([k, v]) => (
                              <SelectItem key={k} value={k} className="text-[12px]">
                                <div className="flex items-center gap-1.5">
                                  <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATUS_COLORS[k])} />
                                  {v}
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button size="sm" variant="outline" className="h-7 text-[11px] px-2 gap-1 text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => handleBulkFavorite(true)}>
                          <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> Fav
                        </Button>
                        <Button size="sm" variant="outline" className="h-7 text-[11px] px-2 gap-1 text-red-500 border-red-200 hover:bg-red-50" onClick={handleBulkDelete}>
                          <Trash2 className="h-3 w-3" /> Delete
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* AI Search footer */}
              <div className="border-t p-3 bg-card shrink-0 space-y-2">
                {/* Location — chip when search done, select when editing or first-time */}
                {availableLocations.length > 0 && (
                  <div className="flex items-center gap-1.5 h-6">
                    <MapPin className="h-3 w-3 text-stone shrink-0" aria-hidden />
                    {jobs.length > 0 && !editingLocation ? (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[12px] text-ink-soft font-medium truncate flex-1">
                          {selectedLocation?.label ?? 'Location'}
                        </span>
                        <button
                          onClick={() => setEditingLocation(true)}
                          disabled={isSearchRunning}
                          className="text-[10px] text-brand-400 hover:text-brand-600 shrink-0 font-medium disabled:opacity-40"
                        >
                          Change
                        </button>
                      </div>
                    ) : (
                      <select
                        value={selectedLocation ? (selectedLocation.country_code ?? 'remote') : ''}
                        onChange={e => {
                          const opt = availableLocations.find(
                            l => (l.country_code ?? 'remote') === e.target.value
                          ) ?? null
                          setSelectedLocation(opt)
                          setEditingLocation(false)
                          if (opt) {
                            try { localStorage.setItem('gj_last_location', opt.country_code ?? 'remote') } catch {}
                          }
                        }}
                        onBlur={() => { if (jobs.length > 0) setEditingLocation(false) }}
                        // eslint-disable-next-line jsx-a11y/no-autofocus
                        autoFocus={editingLocation}
                        disabled={isSearchRunning}
                        aria-label="Search location"
                        className="flex-1 text-[12px] text-ink-soft bg-transparent border-0 outline-none cursor-pointer truncate disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        {availableLocations.map(l => (
                          <option key={l.country_code ?? 'remote'} value={l.country_code ?? 'remote'}>
                            {l.label}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}

                {/* Applied today motivator */}
                {appliedToday > 0 && (
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-md">
                    <CheckCircle2 className="h-3 w-3 text-emerald-500 shrink-0" />
                    <span className="text-[11px] text-emerald-700 font-medium">
                      {appliedToday} applied today{appliedThisWeek > appliedToday ? ` · ${appliedThisWeek} this week` : ''}
                    </span>
                  </div>
                )}

                {/* Find jobs button */}
                <button
                  disabled={isSearchRunning}
                  onClick={() => fileInputRef.current?.click()}
                  aria-label={isSearchRunning ? 'AI search in progress' : 'Find jobs with AI — upload resume PDF'}
                  aria-busy={isSearchRunning}
                  className={cn(
                    "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-[13px] font-semibold transition-all",
                    isSearchRunning
                      ? "bg-brand-50 border border-brand-200 text-brand-400 cursor-not-allowed"
                      : jobs.length === 0
                        ? "bg-brand-600 hover:bg-brand-700 text-white"
                        : "border border-dashed border-line text-stone hover:border-brand-300 hover:text-brand-600 hover:bg-brand-50/30 focus-visible:outline-none",
                  )}
                >
                  <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>{isSearchRunning ? 'Searching…' : 'Find jobs with AI'}</span>
                </button>

                {/* Search again quick-button */}
                {resumeFile && !isSearchRunning && jobs.length > 0 && (
                  <button
                    onClick={() => startSearch(resumeFile, selectedLocation)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-stone hover:text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3 shrink-0" />
                    <span className="truncate">Re-run with {resumeFile.name.replace(/\.pdf$/i, '')}</span>
                  </button>
                )}
              </div>
            </aside>

            {/* Copilot panel — hidden on mobile when no job is selected */}
            <main className={cn(
              "flex-1 overflow-hidden bg-paper relative flex flex-col",
              !selectedId ? "hidden md:flex" : "flex",
            )}>

              {/* Mobile back button — shown only on small screens */}
              <div className="flex md:hidden items-center gap-1.5 px-3 py-2.5 border-b bg-card shrink-0">
                <button
                  onClick={() => setSelectedId(null)}
                  aria-label="Back to job list"
                  className="flex items-center gap-1 text-[13px] text-stone hover:text-ink transition-colors -ml-0.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Jobs</span>
                </button>
                {selectedJob && (
                  <span className="text-[13px] text-stone truncate ml-1">
                    · {selectedJob.title}
                  </span>
                )}
              </div>

              {/* Bulk generation progress overlay */}
              {bulkProgress && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-paper/96 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-5 text-center max-w-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/goose.gif" alt="Generating…" width={72} height={72} className="rounded-md" />
                    <div>
                      <p className="text-[15px] font-semibold tracking-tight text-ink">
                        Generating {bulkProgress.type}
                      </p>
                      <p className="text-[13px] text-stone mt-1">
                        {bulkProgress.current} of {bulkProgress.total} jobs
                      </p>
                    </div>
                    <div className="w-48 h-1 rounded-full bg-paper-2 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-brand-500 transition-all duration-300"
                        style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk done banner */}
              {bulkDone && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-md text-[13px] text-emerald-700 font-medium">
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                  {bulkDone.type} generated for {bulkDone.count} {bulkDone.count === 1 ? 'job' : 'jobs'}
                  <button onClick={() => setBulkDone(null)} aria-label="Dismiss" className="ml-1 text-emerald-500 hover:text-emerald-700">
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              )}

              {/* AI Search overlay (overlay mode only) */}
              {showOverlay && (
                <AiSearchLoader
                  logs={logs}
                  jobCount={jobCount}
                  error={error}
                  onDone={handleLoaderDone}
                  onDismissError={handleDismissError}
                  onRunInBackground={goBackground}
                />
              )}

              {selectedJob ? (
                <JobCopilotPanel
                  job={selectedJob}
                  masterResume={resumeFile}
                  masterResumeText={masterResumeText}
                  onUpdate={handleUpdate}
                  onRemove={handleRemove}
                  onUploadResume={() => resumeOnlyRef.current?.click()}
                  detailHref={`/job-tracker/${selectedJob.id}`}
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-10">
                  <BriefcaseBusiness className="h-8 w-8 text-stone/25 mb-4" aria-hidden />
                  <h2 className="text-[15px] font-semibold tracking-tight text-ink">Select a job</h2>
                  <p className="text-[13px] text-stone mt-1.5 max-w-sm leading-relaxed">
                    Add jobs manually, paste a URL, or run an AI search — then use the copilot to prepare each application.
                  </p>
                  <div className="flex gap-2 mt-5">
                    <Button
                      size="sm"
                      onClick={() => setShowAddModal(true)}
                      className="gap-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md h-8 text-[13px] font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add job
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 rounded-md h-8 text-[13px]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Search className="h-3.5 w-3.5" /> Find with AI
                    </Button>
                  </div>
                </div>
              )}
            </main>
          </div>{/* end flex row: aside + main */}
          </div>
        )}

        {/* ── DASHBOARD ─────────────────────────────────────────────────── */}
        {currentView === 'home' && (
          <div className="flex-1 overflow-auto pb-16 md:pb-0">
            <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
              {/* Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold tracking-tight">Dashboard</h2>
                  <p className="text-[13px] text-stone mt-0.5">Your job search at a glance</p>
                </div>
                <div className="flex gap-2">
                  {jobs.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-7 text-[12px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 rounded-md"
                      onClick={() => { setCurrentView('jobs'); setTimeout(() => setShowQuickApply(true), 100) }}
                    >
                      <Zap className="h-3.5 w-3.5" /> Start applying
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="gap-1.5 h-7 text-[12px] bg-brand-600 hover:bg-brand-700 text-white rounded-md"
                    onClick={() => { setCurrentView('jobs'); setTimeout(() => fileInputRef.current?.click(), 100) }}
                  >
                    <Search className="h-3.5 w-3.5" /> Find jobs
                  </Button>
                </div>
              </div>

              {/* Stats strip */}
              <div className="border rounded-md bg-card overflow-hidden">
                <div className="grid grid-cols-3 md:grid-cols-6 divide-x divide-line">
                  {[
                    { label: 'Tracked',   value: jobs.length,              color: 'text-ink' },
                    { label: 'To Apply',  value: toApplyCount,             color: 'text-ink-soft' },
                    { label: 'Applied',   value: appliedCount,             color: 'text-blue-600' },
                    { label: 'Interview', value: interviewCount,           color: 'text-amber-600' },
                    { label: 'Offer',     value: offerCount,               color: 'text-emerald-600' },
                    { label: 'Declined',  value: rejectedCount + ghostedCount, color: 'text-stone' },
                  ].map(item => (
                    <button
                      key={item.label}
                      onClick={() => setCurrentView('applications')}
                      className="p-3 text-left hover:bg-paper-2 transition-colors"
                    >
                      <p className={cn("text-xl font-bold tabular-nums leading-none", item.color)}>{item.value}</p>
                      <p className="fg-label mt-1.5">{item.label}</p>
                    </button>
                  ))}
                </div>
              </div>

              {/* Weekly goal progress */}
              {weeklyGoal > 0 && (
                <div className="border rounded-md bg-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-[13px] font-semibold text-ink">Weekly goal</h3>
                    <span className="fg-data text-[12px] text-ink-soft">
                      {appliedThisWeek} / {weeklyGoal}
                    </span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-paper-2 overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all duration-500",
                        appliedThisWeek >= weeklyGoal ? "bg-emerald-500" : "bg-brand-500")}
                      style={{ width: `${Math.min((appliedThisWeek / weeklyGoal) * 100, 100)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-stone mt-1.5">
                    {appliedThisWeek >= weeklyGoal
                      ? "Goal reached this week."
                      : `${weeklyGoal - appliedThisWeek} more to reach your target`}
                  </p>
                </div>
              )}

              {/* Velocity + Pipeline row */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Application velocity */}
                <div className="border rounded-md bg-card p-4 space-y-3">
                  <h3 className="text-[13px] font-semibold text-ink">Application velocity</h3>
                  {jobs.length === 0 ? (
                    <p className="text-[12px] text-stone">No jobs tracked yet.</p>
                  ) : (
                    <div className="flex items-end gap-6">
                      <div>
                        <p className="text-2xl font-bold text-brand-700 tabular-nums leading-none">{appliedToday}</p>
                        <p className="text-[11px] text-stone mt-1">today</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-ink-soft tabular-nums leading-none">{appliedThisWeek}</p>
                        <p className="text-[11px] text-stone mt-1">this week</p>
                      </div>
                      {appliedCount > 0 && (
                        <div className="ml-auto text-right">
                          <p className="text-[13px] font-semibold text-ink-soft tabular-nums leading-none">{Math.round((appliedCount / jobs.length) * 100)}%</p>
                          <p className="text-[11px] text-stone mt-1">applied</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Pipeline funnel */}
                <div className="border rounded-md bg-card p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold text-ink">Pipeline</h3>
                    {jobs.length > 0 && (
                      <button
                        className="text-[11px] text-brand-600 hover:text-brand-700 font-medium"
                        onClick={() => setCurrentView('applications')}
                      >
                        Full view →
                      </button>
                    )}
                  </div>
                  <PipelineChart
                    toApply={toApplyCount}
                    applied={appliedCount}
                    interview={interviewCount}
                    offer={offerCount}
                    rejected={rejectedCount}
                    ghosted={ghostedCount}
                    onStageClick={status => {
                      setCurrentView('jobs')
                      setBoardFilters(f => ({ ...f, status: status as JobStatus }))
                    }}
                  />
                </div>
              </div>

              {/* Follow-ups due — high priority */}
              {followUpJobs.length > 0 && (
                <div className="border border-amber-200 bg-amber-50 rounded-md p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[13px] font-semibold text-amber-800">
                      Follow-ups overdue
                      <span className="ml-2 text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-200 text-amber-700">{followUpJobs.length}</span>
                    </h3>
                    <button
                      className="text-[11px] text-amber-700 underline hover:text-amber-900"
                      onClick={() => setCurrentView('applications')}
                    >
                      View all
                    </button>
                  </div>
                  <div className="space-y-1.5">
                    {followUpJobs.slice(0, 4).map(j => (
                      <button
                        key={j.id}
                        onClick={() => { setSelectedId(j.id); setCurrentView('jobs') }}
                        className="w-full flex items-center justify-between gap-3 p-2.5 rounded-md bg-card border border-amber-100 hover:border-amber-200 text-left transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-ink truncate">{j.title}</p>
                          <p className="text-[11px] text-stone truncate">{j.company}</p>
                        </div>
                        <span className="fg-data text-[11px] text-amber-700 shrink-0">Due {j.followUpAt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lower section: recent activity + quick actions */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Recent applications */}
                <div className="border rounded-md bg-card p-4 space-y-3">
                  <h3 className="text-[13px] font-semibold text-ink">Recent applications</h3>
                  {recentApplied.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-[12px] text-stone">No applications yet.</p>
                      <button
                        className="text-[12px] text-brand-500 underline mt-1"
                        onClick={() => setCurrentView('jobs')}
                      >
                        Go to My Jobs →
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {recentApplied.map(j => (
                        <button
                          key={j.id}
                          onClick={() => { setSelectedId(j.id); setCurrentView('jobs') }}
                          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-paper-2 text-left transition-colors group"
                        >
                          <div className="h-6 w-6 rounded bg-paper-2 border border-line flex items-center justify-center shrink-0 text-[10px] font-bold text-stone">
                            {j.company.replace(/^the\s+/i, '')[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-ink truncate leading-snug">{j.title}</p>
                            <p className="text-[11px] text-stone truncate">{j.company}</p>
                          </div>
                          <span className="text-[10px] text-stone shrink-0">
                            {j.appliedAt ? new Date(j.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }) : ''}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Quick actions */}
                <div className="space-y-3">
                  {/* Favorites pending */}
                  {favoritesUnread > 0 && (
                    <div className="border border-amber-200 bg-amber-50/40 rounded-md p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink">{favoritesUnread} starred {favoritesUnread !== 1 ? 'jobs' : 'job'} not applied</p>
                        <p className="text-[11px] text-stone mt-0.5">Waiting in your saved list.</p>
                      </div>
                      <button
                        className="text-[11px] text-amber-700 underline shrink-0 font-medium"
                        onClick={() => { setCurrentView('jobs'); setBoardFilters(f => ({ ...f, favoritesOnly: true, status: 'to_apply' })) }}
                      >
                        View
                      </button>
                    </div>
                  )}

                  {/* AI content ready */}
                  {aiReadyCount > 0 && (
                    <div className="border border-brand-100 bg-brand-50/40 rounded-md p-4 flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-[13px] font-semibold text-ink">{aiReadyCount} {aiReadyCount !== 1 ? 'documents' : 'document'} ready</p>
                        <p className="text-[11px] text-stone mt-0.5">Tailored resumes and cover letters ready to send.</p>
                      </div>
                      <button
                        className="text-[11px] text-brand-600 underline shrink-0 font-medium"
                        onClick={() => setCurrentView('resumes')}
                      >
                        View
                      </button>
                    </div>
                  )}

                  {/* Daily Digest nudge */}
                  <DigestNudge
                    jobCount={jobs.length}
                    onNavigateToSettings={() => setCurrentView('settings')}
                  />

                  {/* CTA if no jobs */}
                  {jobs.length === 0 && (
                    <div className="border border-dashed rounded-md p-5 space-y-2.5">
                      <p className="text-[13px] font-semibold text-ink">No jobs tracked yet</p>
                      <p className="text-[12px] text-stone">Upload your resume to run an AI search, or add jobs manually.</p>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md h-8 text-[12px] mt-1"
                        onClick={() => { setCurrentView('jobs'); setTimeout(() => fileInputRef.current?.click(), 100) }}
                      >
                        <Search className="h-3.5 w-3.5" /> Find jobs with AI
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ── APPLICATIONS ──────────────────────────────────────────────── */}
        {currentView === 'applications' && (() => {
          const PIPELINE: { status: JobStatus; label: string; dotColor: string; headerBg: string; headerText: string; headerBorder: string }[] = [
            { status: 'to_apply',  label: 'To Apply',     dotColor: STATUS_COLORS.to_apply,  headerBg: 'bg-paper-2',    headerText: 'text-ink-soft',    headerBorder: 'border-line' },
            { status: 'applied',   label: 'Applied',      dotColor: STATUS_COLORS.applied,   headerBg: 'bg-blue-50',    headerText: 'text-blue-700',    headerBorder: 'border-blue-200' },
            { status: 'interview', label: 'Interviewing', dotColor: STATUS_COLORS.interview, headerBg: 'bg-amber-50',   headerText: 'text-amber-700',   headerBorder: 'border-amber-200' },
            { status: 'offer',     label: 'Offer',        dotColor: STATUS_COLORS.offer,     headerBg: 'bg-emerald-50', headerText: 'text-emerald-700', headerBorder: 'border-emerald-200' },
            { status: 'rejected',  label: 'Rejected',     dotColor: STATUS_COLORS.rejected,  headerBg: 'bg-red-50/60',  headerText: 'text-red-600',     headerBorder: 'border-red-100' },
            { status: 'ghosted',   label: 'Ghosted',      dotColor: STATUS_COLORS.ghosted,   headerBg: 'bg-paper-2',    headerText: 'text-stone',    headerBorder: 'border-line' },
          ]
          return (
            <div className="flex-1 overflow-auto pb-16 md:pb-0">
              <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Applications</h2>
                    <p className="text-[13px] text-stone mt-0.5">
                      {jobs.length > 0 ? `${jobs.length} jobs tracked · ${appliedCount} applied` : 'Track every application from here'}
                    </p>
                  </div>
                  <div className="flex gap-2 items-center">
                    {/* List / Kanban toggle */}
                    <div className="flex items-center rounded-lg border border-line bg-paper-2 p-0.5">
                      <button onClick={() => setAppViewMode('list')} title="List view"
                        className={cn("h-7 px-2 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors",
                          appViewMode === 'list' ? "bg-card shadow-sm text-ink" : "text-stone hover:text-ink-soft")}>
                        <List className="h-3.5 w-3.5" /> List
                      </button>
                      <button onClick={() => setAppViewMode('kanban')} title="Kanban board"
                        className={cn("h-7 px-2 rounded-md text-[11px] font-medium flex items-center gap-1 transition-colors",
                          appViewMode === 'kanban' ? "bg-card shadow-sm text-ink" : "text-stone hover:text-ink-soft")}>
                        <LayoutGrid className="h-3.5 w-3.5" /> Board
                      </button>
                    </div>
                    <Button size="sm" variant="outline" className="gap-1.5 h-8 text-[12px]" onClick={() => setShowAddModal(true)}>
                      <Plus className="h-3.5 w-3.5" /> Add Job
                    </Button>
                    {toApplyCount > 0 && (
                      <Button size="sm" className="gap-1.5 h-8 text-[12px] bg-brand-600 hover:bg-brand-700 text-white"
                        onClick={() => { setCurrentView('jobs'); setShowQuickApply(quickApplyQueue.length > 0) }}>
                        <Zap className="h-3.5 w-3.5" /> Start applying ({toApplyCount})
                      </Button>
                    )}
                  </div>
                </div>

                {jobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-center">
                    <Send className="h-7 w-7 text-stone/25 mb-4" aria-hidden />
                    <h3 className="font-semibold text-ink text-[15px]">No applications yet</h3>
                    <p className="text-[13px] text-stone mt-1 max-w-xs">Add jobs manually, paste a URL, or run an AI search from your resume.</p>
                    <div className="flex gap-2 mt-5">
                      <Button size="sm" variant="outline" className="rounded-md gap-1.5" onClick={() => setShowAddModal(true)}>
                        <Plus className="h-3.5 w-3.5" /> Add manually
                      </Button>
                      <Button size="sm" className="rounded-md bg-brand-600 hover:bg-brand-700 text-white gap-1.5" onClick={() => { setCurrentView('jobs'); setTimeout(() => fileInputRef.current?.click(), 100) }}>
                        <Search className="h-3.5 w-3.5" /> Find with AI
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    {/* Pipeline chart */}
                    <div className="border rounded-md bg-card p-4">
                      <h3 className="text-[13px] font-semibold text-ink mb-4">Pipeline</h3>
                      <PipelineChart
                        toApply={toApplyCount}
                        applied={appliedCount}
                        interview={interviewCount}
                        offer={offerCount}
                        rejected={rejectedCount}
                        ghosted={ghostedCount}
                        onStageClick={status => {
                          setCurrentView('jobs')
                          setBoardFilters(f => ({ ...f, status: status as JobStatus }))
                        }}
                      />
                    </div>

                    {/* Applications filter bar */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <div className="relative flex-1 min-w-[160px] max-w-sm">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-stone pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search applications…"
                          value={appSearch}
                          onChange={e => setAppSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 text-[12px] rounded-lg bg-card border border-line outline-none focus:border-brand-300 focus:ring-1 focus:ring-brand-200 placeholder:text-stone/50"
                        />
                        {appSearch && (
                          <button onClick={() => setAppSearch('')} className="absolute right-2 top-1/2 -translate-y-1/2 text-stone hover:text-ink-soft">
                            <X className="h-3 w-3" />
                          </button>
                        )}
                      </div>
                      <Select value={appSort} onValueChange={v => setAppSort(v as SortKey)}>
                        <SelectTrigger className="h-8 w-[130px] text-[12px] border-line bg-card shrink-0">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="text-[12px]">
                          <SelectItem value="newest" className="text-[12px]">Newest first</SelectItem>
                          <SelectItem value="match" className="text-[12px]">Best match</SelectItem>
                          <SelectItem value="company" className="text-[12px]">Company A–Z</SelectItem>
                          <SelectItem value="applied" className="text-[12px]">Applied date</SelectItem>
                        </SelectContent>
                      </Select>
                      <button
                        onClick={() => setAppFavOnly(f => !f)}
                        aria-pressed={appFavOnly}
                        title="Favorites only"
                        className={cn(
                          "h-8 w-8 flex items-center justify-center rounded-lg border shrink-0 transition-colors",
                          appFavOnly ? "border-amber-300 bg-amber-50 text-amber-500" : "border-line bg-card text-stone hover:text-amber-400",
                        )}
                      >
                        <Star className={cn("h-4 w-4", appFavOnly && "fill-amber-400")} />
                      </button>
                      {(appSearch || appSort !== 'newest' || appFavOnly) && (
                        <>
                          <button
                            onClick={() => { setAppSearch(''); setAppSort('newest'); setAppFavOnly(false) }}
                            className="h-8 px-2.5 rounded-lg border border-line bg-card text-[11px] text-stone hover:text-ink flex items-center gap-1 shrink-0"
                          >
                            <X className="h-3 w-3" /> Clear
                          </button>
                          <span className="text-[11px] text-stone ml-auto tabular-nums">
                            {filteredAppJobs.length} of {jobs.length}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Kanban board view */}
                    {appViewMode === 'kanban' && (() => {
                      const KANBAN_COLS: { status: JobStatus | 'closed'; label: string; statuses: JobStatus[]; headerBg: string; headerText: string; headerBorder: string }[] = [
                        { status: 'to_apply',  label: 'To Apply',     statuses: ['to_apply'],           headerBg: 'bg-paper-2',    headerText: 'text-ink-soft',    headerBorder: 'border-line' },
                        { status: 'applied',   label: 'Applied',      statuses: ['applied'],            headerBg: 'bg-blue-50',    headerText: 'text-blue-700',    headerBorder: 'border-blue-200' },
                        { status: 'interview', label: 'Interviewing', statuses: ['interview'],          headerBg: 'bg-amber-50',   headerText: 'text-amber-700',   headerBorder: 'border-amber-200' },
                        { status: 'offer',     label: 'Offer',        statuses: ['offer'],              headerBg: 'bg-emerald-50', headerText: 'text-emerald-700', headerBorder: 'border-emerald-200' },
                        { status: 'closed',    label: 'Closed',       statuses: ['rejected','ghosted'], headerBg: 'bg-red-50/60',  headerText: 'text-red-600',     headerBorder: 'border-red-100' },
                      ]
                      return (
                        <div className="flex gap-3 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
                          {KANBAN_COLS.map(col => {
                            const colJobs = filteredAppJobs.filter(j => col.statuses.includes(j.status as JobStatus))
                            const isDragTarget = col.statuses.includes(dragOverStatus as JobStatus)
                            return (
                              <div key={col.status}
                                className={cn("flex flex-col rounded-md border min-w-[220px] w-[220px] shrink-0 transition-colors", col.headerBg, col.headerBorder,
                                  isDragTarget && "ring-2 ring-brand-400 ring-offset-1")}
                                onDragOver={e => { e.preventDefault(); setDragOverStatus(col.statuses[0]) }}
                                onDragLeave={() => setDragOverStatus(null)}
                                onDrop={e => {
                                  e.preventDefault()
                                  if (draggingId && col.statuses[0] !== 'rejected') {
                                    const newStatus = col.statuses[0] as JobStatus
                                    const extra: Record<string, unknown> = {}
                                    if (newStatus === 'applied') extra.appliedAt = new Date().toISOString()
                                    copilotStore.update(draggingId, { status: newStatus, ...extra })
                                    refreshJobs()
                                  }
                                  setDraggingId(null); setDragOverStatus(null)
                                }}
                              >
                                <div className={cn("flex items-center gap-2 px-3 py-2.5 rounded-t-md border-b", col.headerBorder)}>
                                  <span className={cn("text-[11px] font-bold uppercase tracking-wider", col.headerText)}>{col.label}</span>
                                  <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded-md border ml-auto", col.headerBg, col.headerText, col.headerBorder)}>{colJobs.length}</span>
                                </div>
                                <div className="flex-1 p-2 space-y-2 overflow-y-auto">
                                  {colJobs.map(j => (
                                    <div key={j.id} draggable
                                      onDragStart={() => setDraggingId(j.id)}
                                      onDragEnd={() => { setDraggingId(null); setDragOverStatus(null) }}
                                      onClick={() => { setSelectedId(j.id); setCurrentView('jobs') }}
                                      className={cn("bg-card border border-line rounded-lg p-2.5 cursor-grab active:cursor-grabbing hover:shadow-sm transition-shadow group",
                                        draggingId === j.id && "opacity-40")}
                                    >
                                      <div className="flex items-start gap-1.5">
                                        <GripVertical className="h-3.5 w-3.5 text-stone/50 shrink-0 mt-0.5 group-hover:text-stone" />
                                        <div className="min-w-0 flex-1">
                                          <p className="text-[12px] font-semibold text-ink leading-snug line-clamp-2">{j.title}</p>
                                          <p className="text-[11px] text-stone mt-0.5 truncate">{j.company}</p>
                                        </div>
                                        {j.favorite && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0 mt-0.5" />}
                                      </div>
                                      {j.matchScore !== undefined && (
                                        <div className="mt-1.5 flex justify-end">
                                          <MatchTierBadge score={j.matchScore} />
                                        </div>
                                      )}
                                    </div>
                                  ))}
                                  {colJobs.length === 0 && (
                                    <div className="h-16 flex items-center justify-center">
                                      <p className="text-[11px] text-stone/50">Drop here</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )
                    })()}

                    {/* Status groups — list view */}
                    {appViewMode === 'list' && <div className="space-y-6">
                      {PIPELINE.map(({ status, label, dotColor, headerBg, headerText, headerBorder }) => {
                        const group = filteredAppJobs.filter(j => j.status === status)
                        if (group.length === 0) return null
                        return (
                          <div key={status}>
                            <div className={cn("flex items-center gap-2 px-3 py-2 rounded-xl mb-3 border", headerBg, headerBorder)}>
                              <span className={cn("h-2.5 w-2.5 rounded-full shrink-0", dotColor)} />
                              <span className={cn("text-[12px] font-bold uppercase tracking-wider", headerText)}>{label}</span>
                              <span className={cn("text-[11px] font-semibold px-1.5 py-0.5 rounded-md ml-1 border", headerBg, headerText, headerBorder)}>
                                {group.length}
                              </span>
                              {status === 'to_apply' && group.length > 0 && (
                                <button className="ml-auto text-[11px] text-brand-500 hover:text-brand-700 font-medium"
                                  onClick={() => { setCurrentView('jobs'); setShowQuickApply(true) }}>
                                  Start applying →
                                </button>
                              )}
                            </div>
                            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                              {group.map(j => {
                                const isOverdue = j.followUpAt && j.followUpAt <= today
                                const isDeadlineSoon = j.deadline && j.deadline >= today && j.deadline <= new Date(Date.now() + 3 * 864e5).toISOString().slice(0,10)
                                const isDeadlinePassed = j.deadline && j.deadline < today
                                const daysSinceApplied = j.appliedAt
                                  ? Math.floor((Date.now() - new Date(j.appliedAt).getTime()) / 864e5)
                                  : null
                                const isSlowResponse = daysSinceApplied !== null && daysSinceApplied >= 7 && ['applied'].includes(j.status)
                                return (
                                  <button key={j.id}
                                    className={cn(
                                      "border rounded-md p-3.5 bg-card text-left transition-colors group",
                                      "hover:bg-paper-2 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-brand-400",
                                      isOverdue && "border-amber-200 bg-amber-50/30",
                                      isDeadlinePassed && "border-red-200 bg-red-50/20",
                                    )}
                                    onClick={() => { setSelectedId(j.id); setCurrentView('jobs') }}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <div className="h-8 w-8 rounded bg-paper-2 border border-line flex items-center justify-center shrink-0 text-[12px] font-bold text-stone">
                                        {j.company.replace(/^the\s+/i, '')[0]?.toUpperCase() ?? '?'}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <p className="font-semibold text-[13px] text-ink truncate leading-snug">{j.title}</p>
                                          {j.favorite && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
                                        </div>
                                        <p className="text-[12px] text-stone mt-0.5 truncate">{j.company}{j.location && j.location !== 'Not specified' ? ` · ${j.location}` : ''}</p>
                                      </div>
                                      {j.matchScore !== undefined && <MatchTierBadge score={j.matchScore} />}
                                    </div>
                                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                      {j.appliedAt && (
                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600">
                                          ✓ {new Date(j.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                      {daysSinceApplied !== null && (
                                        <span className={cn("inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded border",
                                          isSlowResponse ? "bg-orange-50 border-orange-200 text-orange-600 font-medium" : "bg-paper-2 border-line text-stone")}>
                                          <Timer className="h-2.5 w-2.5" />
                                          {daysSinceApplied}d{isSlowResponse ? ' — chase up?' : ''}
                                        </span>
                                      )}
                                      {isDeadlineSoon && (
                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-600 font-medium">
                                          ⏳ Deadline {new Date(j.deadline!).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                      {isDeadlinePassed && (
                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-red-50 border border-red-200 text-red-500">
                                          Deadline passed
                                        </span>
                                      )}
                                      {isOverdue && (
                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-600 font-medium">
                                          ⏰ Follow-up due
                                        </span>
                                      )}
                                      {j.rejectionReason && (
                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-paper-2 border border-line text-stone">
                                          {j.rejectionReason.replace('_',' ')}
                                        </span>
                                      )}
                                      {j.aiContent?.coverLetter && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 border border-brand-100 text-brand-500">CL ✓</span>
                                      )}
                                      {j.aiContent?.tailoredResume && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-brand-50 border border-brand-100 text-brand-500">Resume ✓</span>
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                      {filteredAppJobs.length === 0 && (appSearch || appFavOnly) && (
                        <div className="text-center py-12">
                          <p className="text-[13px] text-stone">No applications match your search.</p>
                          <button
                            className="mt-2 text-[12px] text-brand-600 hover:text-brand-700 underline"
                            onClick={() => { setAppSearch(''); setAppFavOnly(false) }}
                          >
                            Clear filters
                          </button>
                        </div>
                      )}
                    </div>}
                  </>
                )}
              </div>
            </div>
          )
        })()}

        {/* ── DISCOVER ──────────────────────────────────────────────────── */}
        {currentView === 'discover' && (
          <DiscoverPanel
            onTrackJob={(partial) => {
              const newJob = copilotStore.add({
                title: partial.title ?? 'Untitled',
                company: partial.company ?? '',
                location: partial.location ?? '',
                salary: partial.salary ?? '',
                description: partial.description ?? '',
                applyUrl: partial.applyUrl ?? '',
                source: 'url',
                status: 'to_apply',
                notes: '',
                favorite: false,
                requirements: [],
              })
              setJobs(copilotStore.getAll())
              setSelectedId(newJob.id)
              setCurrentView('jobs')
            }}
          />
        )}

        {/* ── SETTINGS ──────────────────────────────────────────────────── */}
        {currentView === 'settings' && (
          <SettingsPanel
            jobs={jobs}
            onClearWorkspace={() => {
              if (confirm('Clear all jobs from your workspace? This cannot be undone.')) {
                localStorage.removeItem('goosejobs_copilot_v1')
                localStorage.removeItem('gj_onboarded')
                setJobs([])
                setSelectedId(null)
                window.location.href = '/onboarding'
              }
            }}
          />
        )}

        {/* ── INTERVIEWS (coming soon) ───────────────────────────────────── */}
        {currentView === 'interviews' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Lock className="h-9 w-9 text-stone/30 mb-4" aria-hidden />
            <h2 className="text-[15px] font-semibold capitalize tracking-tight">Interviews</h2>
            <p className="text-[13px] text-stone mt-1">Coming soon.</p>
          </div>
        )}

        {/* ── RESUMES & COVER LETTERS ───────────────────────────────────── */}
        {currentView === 'resumes' && (() => {
          const jobsWithContent = jobs.filter(j => j.aiContent?.coverLetter || j.aiContent?.tailoredResume)

          const handleCopy = (text: string, key: string) => {
            navigator.clipboard.writeText(text).then(() => {
              setCopiedKey(key)
              setTimeout(() => setCopiedKey(null), 2000)
            })
          }

          return (
            <div className="flex-1 overflow-auto pb-16 md:pb-0">
              <div className="p-4 md:p-6 max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Resumes &amp; Cover Letters</h2>
                    <p className="text-[13px] text-stone mt-0.5">
                      {jobsWithContent.length > 0
                        ? `${jobsWithContent.length} job${jobsWithContent.length !== 1 ? 's' : ''} with AI-generated documents`
                        : 'Generate documents from My Jobs using the AI copilot'}
                    </p>
                  </div>
                </div>

                {/* Resume Vault */}
                <div className="border rounded-md bg-card overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b bg-paper-2/50">
                    <div>
                      <h3 className="text-[13px] font-semibold text-ink">Resume Vault</h3>
                      <p className="text-[11px] text-stone mt-0.5">
                        {allResumes.length === 0
                          ? 'Upload your base resume to enable AI features'
                          : `${allResumes.length} resume${allResumes.length !== 1 ? 's' : ''} · active one used for all AI generation`}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-7 text-[12px]"
                      onClick={() => resumeOnlyRef.current?.click()}
                    >
                      <Plus className="h-3 w-3" /> Upload
                    </Button>
                  </div>

                  {allResumes.length === 0 ? (
                    <div className="p-8 flex flex-col items-center text-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-paper-2 border border-line flex items-center justify-center">
                        <FileText className="h-5 w-5 text-stone/50" />
                      </div>
                      <div>
                        <p className="text-[13px] font-semibold text-ink-soft">No resume uploaded yet</p>
                        <p className="text-[12px] text-stone mt-1 max-w-xs leading-relaxed">
                          Upload a PDF to enable AI cover letters, tailored resumes, and fit analysis.
                        </p>
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md h-8 text-[12px]"
                        onClick={() => resumeOnlyRef.current?.click()}
                      >
                        <Upload className="h-3.5 w-3.5" /> Upload Resume PDF
                      </Button>
                    </div>
                  ) : (
                    <div className="divide-y divide-line">
                      {allResumes.map(resume => (
                        <div key={resume.id} className={cn(
                          "flex items-center gap-3 px-4 py-3 transition-colors",
                          resume.isActive ? "bg-brand-50/30" : "hover:bg-paper-2/40",
                        )}>
                          <div className={cn(
                            "h-8 w-8 rounded flex items-center justify-center shrink-0",
                            resume.isActive
                              ? "bg-brand-100 border border-brand-200"
                              : "bg-paper-2 border border-line",
                          )}>
                            <FileText className={cn("h-4 w-4", resume.isActive ? "text-brand-600" : "text-stone")} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[13px] font-semibold text-ink truncate">{resume.name}</p>
                              {resume.isActive && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 border border-brand-200 shrink-0">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone mt-0.5">
                              {new Date(resume.uploadedAt).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                              {' · '}{(resume.text.length / 1000).toFixed(1)}k chars
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {!resume.isActive && (
                              <button
                                onClick={() => handleSetActiveResume(resume.id)}
                                className="text-[11px] font-medium text-brand-600 hover:text-brand-800 px-2.5 py-1 rounded-md border border-brand-200 hover:bg-brand-50 transition-colors"
                              >
                                Use this
                              </button>
                            )}
                            <button
                              onClick={() => {
                                if (allResumes.length === 1 && !confirm('Delete your only resume? AI features will be disabled until you upload a new one.')) return
                                handleDeleteResume(resume.id)
                              }}
                              aria-label="Delete resume"
                              className="h-7 w-7 flex items-center justify-center rounded-md text-stone/40 hover:text-red-500 hover:bg-red-50 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Content list */}
                {jobsWithContent.length === 0 ? (
                  <div className="border border-dashed rounded-md p-8 space-y-2.5">
                    <p className="text-[13px] font-semibold text-ink">No documents yet</p>
                    <p className="text-[12px] text-stone max-w-xs">
                      Open a job in My Jobs, then use the Cover Letter or Resume tab to generate tailored documents.
                    </p>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-brand-600 hover:bg-brand-700 text-white rounded-md h-8 text-[12px] mt-1"
                      onClick={() => setCurrentView('jobs')}
                    >
                      Go to My Jobs →
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {jobsWithContent.map(j => {
                      const hasCL = !!j.aiContent?.coverLetter
                      const hasTR = !!j.aiContent?.tailoredResume
                      return (
                        <div key={j.id} className="border rounded-md bg-card overflow-hidden hover:bg-paper-2/40 transition-colors">
                          {/* Job header */}
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-line/50">
                            <div className="h-7 w-7 rounded bg-paper-2 border border-line flex items-center justify-center shrink-0">
                              <span className="text-[10px] font-bold text-stone">
                                {j.company.replace(/^the\s+/i, '')[0]?.toUpperCase() ?? '?'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-ink truncate">{j.title}</p>
                              <p className="text-[11px] text-stone truncate">{j.company}{j.location && j.location !== 'Not specified' ? ` · ${j.location}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {hasCL && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600">Cover Letter</span>
                              )}
                              {hasTR && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-brand-50 border border-brand-100 text-brand-600">Resume</span>
                              )}
                              {j.appliedAt && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-emerald-600">
                                  Applied {new Date(j.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                </span>
                              )}
                            </div>
                          </div>

                          {/* Document action buttons */}
                          <div className="flex flex-wrap gap-2 px-4 py-3">
                            {hasCL && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => { setPreviewJob(j); setPreviewType('coverLetter') }}
                                  className="inline-flex items-center gap-1 text-[11px] text-ink-soft hover:text-brand-600 border border-line rounded-md px-2 py-1 hover:border-brand-200 transition-colors"
                                >
                                  <Eye className="h-3 w-3" /> View Cover Letter
                                </button>
                                <button
                                  onClick={() => handleCopy(j.aiContent.coverLetter!, `${j.id}-cl`)}
                                  className="inline-flex items-center gap-1 text-[11px] text-ink-soft hover:text-brand-600 border border-line rounded-md px-2 py-1 hover:border-brand-200 transition-colors"
                                >
                                  <Copy className="h-3 w-3" />
                                  {copiedKey === `${j.id}-cl` ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                            )}
                            {hasTR && (
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => { setPreviewJob(j); setPreviewType('tailoredResume') }}
                                  className="inline-flex items-center gap-1 text-[11px] text-ink-soft hover:text-brand-600 border border-line rounded-md px-2 py-1 hover:border-brand-200 transition-colors"
                                >
                                  <Eye className="h-3 w-3" /> View Resume
                                </button>
                                <button
                                  onClick={() => handleCopy(j.aiContent.tailoredResume!, `${j.id}-tr`)}
                                  className="inline-flex items-center gap-1 text-[11px] text-ink-soft hover:text-brand-600 border border-line rounded-md px-2 py-1 hover:border-brand-200 transition-colors"
                                >
                                  <Copy className="h-3 w-3" />
                                  {copiedKey === `${j.id}-tr` ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => { setSelectedId(j.id); setCurrentView('jobs') }}
                              className="ml-auto inline-flex items-center gap-1 text-[11px] text-stone hover:text-ink-soft transition-colors"
                            >
                              Open in copilot →
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* ── Search History ─────────────────────────────────────────── */}
              {sessions.length > 0 && (
                <div className="p-6 max-w-4xl mx-auto space-y-4 border-t">
                  <div className="flex items-center justify-between">
                    <h3 className="text-[14px] font-semibold text-ink">Search History</h3>
                    <span className="text-[11px] text-stone">{sessions.length} search{sessions.length !== 1 ? 'es' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {sessions.map(s => {
                      const sessionJobs = jobs.filter(j => j.searchSessionId === s.id)
                      const appliedFromSession = sessionJobs.filter(j => j.appliedAt).length
                      return (
                        <div key={s.id} className="border rounded-md bg-card p-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[13px] font-semibold text-ink truncate">{s.resumeName}</p>
                              {s.location && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-paper-2 border border-line text-stone">{s.location}</span>
                              )}
                            </div>
                            <p className="text-[11px] text-stone mt-0.5">
                              {new Date(s.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                              {s.completedAt ? ` · ${s.jobCount} jobs found` : ' · In progress…'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 text-center">
                            <div>
                              <p className="text-[15px] font-bold text-ink tabular-nums">{sessionJobs.length}</p>
                              <p className="text-[10px] text-stone">in board</p>
                            </div>
                            {appliedFromSession > 0 && (
                              <div>
                                <p className="text-[15px] font-bold text-blue-600 tabular-nums">{appliedFromSession}</p>
                                <p className="text-[10px] text-stone">applied</p>
                              </div>
                            )}
                            <button
                              onClick={() => { setCurrentView('jobs'); setBoardFilters(f => ({ ...f, sessionId: s.id })) }}
                              className="text-[11px] text-brand-500 hover:text-brand-700 underline"
                            >
                              Filter board
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Preview modal — fixed overlay, works anywhere in the tree */}
              {previewJob && (
                <div
                  className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
                  onClick={() => setPreviewJob(null)}
                >
                  <div
                    className="bg-card rounded-md shadow max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-5 py-3.5 border-b">
                      <div>
                        <p className="text-[13px] font-semibold text-ink">
                          {previewType === 'coverLetter' ? 'Cover Letter' : 'Tailored Resume'}
                        </p>
                        <p className="text-[11px] text-stone">{previewJob.title} · {previewJob.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(
                            previewType === 'coverLetter' ? previewJob.aiContent.coverLetter! : previewJob.aiContent.tailoredResume!,
                            `preview-${previewType}`
                          )}
                          className="inline-flex items-center gap-1 text-[12px] text-brand-600 hover:text-brand-800 border border-brand-200 rounded-md px-2.5 py-1 hover:bg-brand-50 transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedKey === `preview-${previewType}` ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => setPreviewJob(null)}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-stone hover:text-ink-soft hover:bg-paper-2"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="overflow-auto flex-1 p-5">
                      <pre className="text-[12px] text-ink-soft leading-relaxed whitespace-pre-wrap font-sans">
                        {previewType === 'coverLetter' ? previewJob.aiContent.coverLetter : previewJob.aiContent.tailoredResume}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Hidden file inputs */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        className="hidden"
        aria-hidden
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleAiSearch(f)
          e.target.value = ''
        }}
      />
      {/* Resume-only upload (from NoResumeBanner — no AI search triggered) */}
      <input
        ref={resumeOnlyRef}
        type="file"
        accept=".pdf"
        className="hidden"
        aria-hidden
        onChange={e => {
          const f = e.target.files?.[0]
          if (f) handleResumeOnlyUpload(f)
          e.target.value = ''
        }}
      />

      {showAddModal && (
        <AddJobModal
          onClose={() => setShowAddModal(false)}
          onAdd={handleAdd}
          onImportUrl={rawJob => handleUrlImport(rawJob as RawApiJob)}
        />
      )}

      {showQuickApply && quickApplyQueue.length > 0 && (
        <QuickApplyModal
          jobs={quickApplyQueue}
          onApplied={id => {
            copilotStore.update(id, { status: 'applied', appliedAt: new Date().toISOString() })
            refreshJobs()
          }}
          onClose={() => setShowQuickApply(false)}
        />
      )}

      <ShortcutsHelp open={showShortcutsHelp} onClose={() => setShowShortcutsHelp(false)} />

      {/* Mobile bottom navigation — replaces sidebar on small screens */}
      <MobileBottomNav currentView={currentView} onViewChange={setCurrentView} />
    </div>
  )
}
