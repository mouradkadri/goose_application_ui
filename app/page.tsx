"use client"

import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Plus, Search, BriefcaseBusiness, Brain, Lock, MapPin, CheckSquare, Square, FileText, Mail, X, CheckCircle2, Star, Trash2, AlertTriangle, ChevronDown, ChevronLeft, Loader2, TrendingUp, Clock, Zap, Copy, Eye, Award, Target, Activity, Send, RotateCcw } from "lucide-react"
import { CopilotJob, JobStatus, STATUS_COLORS, STATUS_LABELS, getMatchTier, MATCH_TIER_COLORS } from "@/types/copilot-job"
import { copilotStore, RawApiJob as StoreRawApiJob } from "@/lib/copilot-store"
import { searchSessions, SearchSession } from "@/lib/search-sessions"
import { masterResume } from "@/lib/master-resume"
import { session as sessionStore } from "@/lib/session"
import { useSearch } from "@/components/search-provider"
import { JobCopilotPanel } from "@/components/job-copilot-panel"
import { AddJobModal } from "@/components/add-job-modal"
import { DashboardSidebar, MobileBottomNav, ViewType } from "@/components/dashboard-sidebar"
import { AiSearchLoader } from "@/components/ai-search-loader"
import { JobBoardToolbar, BoardFilters, DEFAULT_FILTERS, applyFilters, SearchSessionSummary } from "@/components/job-board-toolbar"
import { QuickApplyModal } from "@/components/quick-apply-modal"
import { ShortcutsHelp } from "@/components/shortcuts-help"
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
      <div className="w-10 h-1 rounded-full bg-zinc-100 overflow-hidden">
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
    <div className="h-7 w-7 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
      <span className="text-[11px] font-bold text-zinc-500">{initial}</span>
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
  const [masterResumeText, setMasterResumeText] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null
    return masterResume.get()
  })
  const fileInputRef = useRef<HTMLInputElement>(null)
  const resumeOnlyRef = useRef<HTMLInputElement>(null)

  // Location selector state
  const [availableLocations, setAvailableLocations] = useState<LocationOption[]>([])
  const [selectedLocation, setSelectedLocation] = useState<LocationOption | null>(null)
  const [editingLocation, setEditingLocation] = useState(false)

  // Hydration state — show localStorage jobs instantly, skeleton while server syncs
  const [isHydrating, setIsHydrating] = useState(true)

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

    // Load search session history
    setSessions(searchSessions.getAll())

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
            if (d?.resume_text) { masterResume.set(d.resume_text); setMasterResumeText(d.resume_text) }
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
        if (d?.resume_text) { masterResume.set(d.resume_text); setMasterResumeText(d.resume_text) }
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
        if (d?.resume_text) { masterResume.set(d.resume_text); setMasterResumeText(d.resume_text) }
        if (d?.session_id) sessionStore.setId(d.session_id)
      })
      .catch(() => {})
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

  return (
    <div className="h-screen flex overflow-hidden bg-white">

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

        {/* ── MY JOBS workspace ─────────────────────────────────────────── */}
        {currentView === 'jobs' && (
          <div className="flex flex-1 overflow-hidden">

            {/* Job list sidebar — full-width on mobile, fixed 256 on desktop; hidden on mobile when a job is open */}
            <aside className={cn(
              "border-r flex-col shrink-0 bg-zinc-50/50",
              "w-full md:w-64",
              selectedId ? "hidden md:flex" : "flex",
            )}>

              {/* Header */}
              <div className="flex items-center justify-between px-3 py-2.5 border-b bg-white">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider">Jobs</span>
                  {jobs.length > 0 && (
                    <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500 tabular-nums">
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
                      className={cn("h-6 w-6", selectionMode ? "text-indigo-600 bg-indigo-50" : "text-zinc-400 hover:text-zinc-700")}
                      onClick={() => { setSelectionMode(m => !m); setSelectedIds(new Set()) }}
                    >
                      <CheckSquare className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="ghost"
                    aria-label="Add job"
                    className="h-6 w-6 text-zinc-400 hover:text-zinc-700"
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


              {/* Job list */}
              <div className="flex-1 overflow-y-auto pb-16 md:pb-0">
                {isHydrating && jobs.length === 0 ? (
                  <div className="p-3 space-y-2" aria-label="Loading jobs" role="status">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="px-3 py-2.5 border-b border-zinc-100 animate-pulse">
                        <div className="flex items-start gap-2">
                          <div className="h-7 w-7 rounded-md bg-zinc-100 shrink-0" />
                          <div className="flex-1 space-y-1.5">
                            <div className="h-3 w-3/4 bg-zinc-100 rounded" />
                            <div className="h-2.5 w-1/2 bg-zinc-100 rounded" />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : jobs.length === 0 ? (
                  <div className="p-5 text-center mt-6">
                    <BriefcaseBusiness className="h-8 w-8 mx-auto text-zinc-200 mb-3" aria-hidden />
                    <p className="text-sm font-semibold text-zinc-600">No jobs yet</p>
                    <p className="text-[13px] text-zinc-400 mt-1 leading-relaxed">Add one manually or let the goose hunt.</p>
                    <Button size="sm" variant="outline" className="mt-4 gap-1.5 h-7 text-[12px]" onClick={() => setShowAddModal(true)}>
                      <Plus className="h-3 w-3" /> Add first job
                    </Button>
                  </div>
                ) : visibleJobs.length === 0 ? (
                  <div className="p-5 text-center mt-4">
                    <p className="text-[13px] text-zinc-400">No jobs match your filters.</p>
                    <button
                      className="mt-2 text-[12px] text-indigo-600 hover:text-indigo-700 underline"
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
                              "w-full text-left px-3 py-2.5 transition-colors border-b border-zinc-100 last:border-0 cursor-pointer",
                              "hover:bg-white focus-visible:outline-none focus-visible:bg-indigo-50/40",
                              selectionMode
                                ? isChecked
                                  ? "bg-indigo-50/60 border-l-2 border-l-indigo-400 pl-[10px]"
                                  : "border-l-2 border-l-transparent"
                                : isSelected
                                  ? "bg-white border-l-2 border-l-indigo-500 pl-[10px]"
                                  : "border-l-2 border-l-transparent",
                            )}
                          >
                            <div className="flex items-start gap-2">
                              {selectionMode ? (
                                <div className="h-7 w-7 flex items-center justify-center shrink-0">
                                  {isChecked ? <CheckSquare className="h-4 w-4 text-indigo-600" /> : <Square className="h-4 w-4 text-zinc-300" />}
                                </div>
                              ) : (
                                <CompanyAvatar company={job.company} />
                              )}
                              <div className="min-w-0 flex-1">
                                <p className="text-[13px] font-semibold truncate leading-snug text-zinc-900">{job.title}</p>
                                <p className="text-[12px] text-zinc-500 truncate mt-0.5">{job.company}</p>
                                {job.location && job.location !== 'Not specified' && (
                                  <p className="text-[11px] text-zinc-400 truncate mt-0.5">{job.location}</p>
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
                                      job.favorite ? "text-amber-400" : "text-zinc-200 hover:text-amber-400",
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
                          className="h-7 text-[12px] gap-1.5 text-zinc-500"
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
                <div className="border-t bg-indigo-50/60 px-3 py-2.5 shrink-0 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[12px] font-semibold text-indigo-700">
                      {selectedIds.size === 0 ? 'Select jobs above' : `${selectedIds.size} selected`}
                    </span>
                    {selectedIds.size > 0 && (
                      <button
                        className="text-[11px] text-zinc-400 hover:text-zinc-600 underline"
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
                        <Button size="sm" disabled={!masterResumeText || !!bulkProgress} className="h-7 text-[11px] px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md gap-1" onClick={() => handleBulkGenerate('cover-letter')}>
                          <Mail className="h-3 w-3" /> Cover Letters
                        </Button>
                        <Button size="sm" disabled={!masterResumeText || !!bulkProgress} className="h-7 text-[11px] px-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-md gap-1" onClick={() => handleBulkGenerate('resume')}>
                          <FileText className="h-3 w-3" /> Resumes
                        </Button>
                        <Button size="sm" disabled={!masterResumeText || !!bulkProgress} variant="outline" className="h-7 text-[11px] px-2 rounded-md" onClick={() => handleBulkGenerate('both')}>Both</Button>
                      </div>
                      {/* Tracking actions */}
                      <div className="flex gap-1.5 flex-wrap pt-1 border-t border-indigo-100">
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
              <div className="border-t p-3 bg-white shrink-0 space-y-2">
                {/* Location — chip when search done, select when editing or first-time */}
                {availableLocations.length > 0 && (
                  <div className="flex items-center gap-1.5 h-6">
                    <MapPin className="h-3 w-3 text-zinc-400 shrink-0" aria-hidden />
                    {jobs.length > 0 && !editingLocation ? (
                      <div className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="text-[12px] text-zinc-700 font-medium truncate flex-1">
                          {selectedLocation?.label ?? 'Location'}
                        </span>
                        <button
                          onClick={() => setEditingLocation(true)}
                          disabled={isSearchRunning}
                          className="text-[10px] text-indigo-400 hover:text-indigo-600 shrink-0 font-medium disabled:opacity-40"
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
                        className="flex-1 text-[12px] text-zinc-600 bg-transparent border-0 outline-none cursor-pointer truncate disabled:opacity-50 disabled:cursor-not-allowed"
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
                  <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-emerald-50 border border-emerald-100 rounded-lg">
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
                      ? "bg-indigo-50 border border-indigo-200 text-indigo-400 cursor-not-allowed"
                      : jobs.length === 0
                        ? "bg-indigo-600 hover:bg-indigo-700 text-white shadow-sm hover:shadow"
                        : "border border-dashed border-zinc-200 text-zinc-500 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 focus-visible:outline-none",
                  )}
                >
                  <Search className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>{isSearchRunning ? 'Searching…' : 'Find jobs with AI'}</span>
                </button>

                {/* Search again quick-button */}
                {resumeFile && !isSearchRunning && jobs.length > 0 && (
                  <button
                    onClick={() => startSearch(resumeFile, selectedLocation)}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-[11px] text-zinc-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                  >
                    <RotateCcw className="h-3 w-3 shrink-0" />
                    <span className="truncate">Re-run with {resumeFile.name.replace(/\.pdf$/i, '')}</span>
                  </button>
                )}
              </div>
            </aside>

            {/* Copilot panel — hidden on mobile when no job is selected */}
            <main className={cn(
              "flex-1 overflow-hidden bg-white relative flex flex-col",
              !selectedId ? "hidden md:flex" : "flex",
            )}>

              {/* Mobile back button — shown only on small screens */}
              <div className="flex md:hidden items-center gap-1.5 px-3 py-2.5 border-b bg-white shrink-0">
                <button
                  onClick={() => setSelectedId(null)}
                  aria-label="Back to job list"
                  className="flex items-center gap-1 text-[13px] text-zinc-500 hover:text-zinc-900 transition-colors -ml-0.5"
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span>Jobs</span>
                </button>
                {selectedJob && (
                  <span className="text-[13px] text-zinc-400 truncate ml-1">
                    · {selectedJob.title}
                  </span>
                )}
              </div>

              {/* Bulk generation progress overlay */}
              {bulkProgress && (
                <div className="absolute inset-0 z-30 flex items-center justify-center bg-white/96 backdrop-blur-sm">
                  <div className="flex flex-col items-center gap-5 text-center max-w-xs">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src="/goose.gif" alt="Generating…" width={72} height={72} className="rounded-xl" />
                    <div>
                      <p className="text-[15px] font-semibold tracking-tight text-zinc-900">
                        Generating {bulkProgress.type}
                      </p>
                      <p className="text-[13px] text-zinc-500 mt-1">
                        {bulkProgress.current} of {bulkProgress.total} jobs
                      </p>
                    </div>
                    <div className="w-48 h-1.5 rounded-full bg-zinc-100 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-indigo-500 transition-all duration-300"
                        style={{ width: `${(bulkProgress.current / bulkProgress.total) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Bulk done banner */}
              {bulkDone && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-full shadow-sm text-[13px] text-emerald-700 font-medium">
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
                />
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center px-10">
                  <div className="h-14 w-14 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-5">
                    <BriefcaseBusiness className="h-7 w-7 text-zinc-300" aria-hidden />
                  </div>
                  <h2 className="text-[15px] font-semibold tracking-tight text-zinc-800">Your job workspace</h2>
                  <p className="text-[13px] text-zinc-400 mt-2 max-w-sm leading-relaxed">
                    Add a job you&apos;re interested in — manually, by URL, or via AI search — then use the copilot to prepare each application.
                  </p>
                  <div className="flex gap-2 mt-6">
                    <Button
                      size="sm"
                      onClick={() => setShowAddModal(true)}
                      className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-9 text-[13px] font-semibold"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add Job
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 rounded-lg h-9 text-[13px]"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      <Search className="h-3.5 w-3.5" /> Find with AI
                    </Button>
                  </div>
                </div>
              )}
            </main>
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
                  <p className="text-[13px] text-zinc-400 mt-0.5">Your job search at a glance</p>
                </div>
                <div className="flex gap-2">
                  {jobs.length > 0 && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-[12px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                      onClick={() => { setCurrentView('jobs'); setTimeout(() => setShowQuickApply(true), 100) }}
                    >
                      <Zap className="h-3.5 w-3.5" /> Start Applying
                    </Button>
                  )}
                  <Button
                    size="sm"
                    className="gap-1.5 h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white"
                    onClick={() => { setCurrentView('jobs'); setTimeout(() => fileInputRef.current?.click(), 100) }}
                  >
                    <Search className="h-3.5 w-3.5" /> Find Jobs
                  </Button>
                </div>
              </div>

              {/* Stats row */}
              <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
                {[
                  { label: 'Tracked',      value: jobs.length,    sub: 'total',        color: 'text-zinc-900',    bg: 'bg-white',          onClick: () => setCurrentView('applications') },
                  { label: 'To Apply',     value: toApplyCount,   sub: 'queued',       color: 'text-zinc-600',    bg: 'bg-white',          onClick: () => setCurrentView('applications') },
                  { label: 'Applied',      value: appliedCount,   sub: 'sent',         color: 'text-blue-600',    bg: 'bg-blue-50/40',     onClick: () => setCurrentView('applications') },
                  { label: 'Interviewing', value: interviewCount, sub: 'in progress',  color: 'text-amber-600',   bg: 'bg-amber-50/40',    onClick: () => setCurrentView('applications') },
                  { label: 'Offers',       value: offerCount,     sub: 'received',     color: 'text-emerald-600', bg: 'bg-emerald-50/40',  onClick: () => setCurrentView('applications') },
                  { label: 'Declined',     value: rejectedCount + ghostedCount, sub: 'rejected/ghosted', color: 'text-red-500', bg: 'bg-red-50/30', onClick: () => setCurrentView('applications') },
                ].map(item => (
                  <button
                    key={item.label}
                    onClick={item.onClick}
                    className={cn("p-3 border rounded-xl text-left hover:shadow-sm transition-shadow cursor-pointer", item.bg)}
                  >
                    <p className="text-[11px] font-medium text-zinc-400 uppercase tracking-wide">{item.label}</p>
                    <p className={cn("text-2xl font-bold mt-0.5 tabular-nums", item.color)}>{item.value}</p>
                    <p className="text-[10px] text-zinc-400 mt-0.5">{item.sub}</p>
                  </button>
                ))}
              </div>

              {/* Velocity + Pipeline row */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Application velocity */}
                <div className="border rounded-xl bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-indigo-500" />
                    <h3 className="text-[13px] font-semibold text-zinc-800">Application Velocity</h3>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="rounded-lg bg-indigo-50 border border-indigo-100 p-3 text-center">
                      <p className="text-2xl font-bold text-indigo-700 tabular-nums">{appliedToday}</p>
                      <p className="text-[11px] text-indigo-400 mt-0.5">applied today</p>
                    </div>
                    <div className="rounded-lg bg-zinc-50 border border-zinc-100 p-3 text-center">
                      <p className="text-2xl font-bold text-zinc-700 tabular-nums">{appliedThisWeek}</p>
                      <p className="text-[11px] text-zinc-400 mt-0.5">this week</p>
                    </div>
                  </div>
                  {jobs.length > 0 && appliedCount > 0 && (
                    <div className="text-[11px] text-zinc-400">
                      <span className="font-medium text-zinc-600">{Math.round((appliedCount / jobs.length) * 100)}%</span> of tracked jobs applied
                    </div>
                  )}
                  {jobs.length === 0 && (
                    <p className="text-[12px] text-zinc-400">No jobs tracked yet.</p>
                  )}
                </div>

                {/* Pipeline funnel */}
                <div className="border rounded-xl bg-white p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-indigo-500" />
                      <h3 className="text-[13px] font-semibold text-zinc-800">Pipeline Funnel</h3>
                    </div>
                    {jobs.length > 0 && (
                      <button
                        className="text-[11px] text-indigo-400 hover:text-indigo-600 font-medium"
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
                <div className="border border-amber-200 bg-amber-50 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <h3 className="text-[13px] font-semibold text-amber-800">Follow-ups Overdue</h3>
                      <span className="text-[11px] font-semibold px-1.5 py-0.5 rounded bg-amber-200 text-amber-700">{followUpJobs.length}</span>
                    </div>
                    <button
                      className="text-[11px] text-amber-600 underline hover:text-amber-800"
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
                        className="w-full flex items-center justify-between gap-3 p-2.5 rounded-lg bg-white border border-amber-100 hover:border-amber-200 text-left transition-colors"
                      >
                        <div className="min-w-0">
                          <p className="text-[12px] font-semibold text-zinc-800 truncate">{j.title}</p>
                          <p className="text-[11px] text-zinc-400 truncate">{j.company}</p>
                        </div>
                        <span className="text-[11px] text-amber-600 font-medium shrink-0">Due {j.followUpAt}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Lower section: recent activity + quick actions */}
              <div className="grid md:grid-cols-2 gap-4">
                {/* Recent applications */}
                <div className="border rounded-xl bg-white p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-indigo-500" />
                    <h3 className="text-[13px] font-semibold text-zinc-800">Recent Applications</h3>
                  </div>
                  {recentApplied.length === 0 ? (
                    <div className="text-center py-6">
                      <p className="text-[12px] text-zinc-400">No applications yet.</p>
                      <button
                        className="text-[12px] text-indigo-500 underline mt-1"
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
                          className="w-full flex items-center gap-2.5 p-2 rounded-lg hover:bg-zinc-50 text-left transition-colors group"
                        >
                          <div className="h-7 w-7 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0 text-[10px] font-bold text-zinc-500">
                            {j.company.replace(/^the\s+/i, '')[0]?.toUpperCase() ?? '?'}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-semibold text-zinc-800 truncate leading-snug">{j.title}</p>
                            <p className="text-[11px] text-zinc-400 truncate">{j.company}</p>
                          </div>
                          <span className="text-[10px] text-zinc-400 shrink-0">
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
                    <div className="border border-amber-100 bg-amber-50/40 rounded-xl p-4 flex items-start gap-3">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-zinc-800">{favoritesUnread} favorite{favoritesUnread !== 1 ? 's' : ''} not yet applied</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">Your starred jobs are waiting.</p>
                      </div>
                      <button
                        className="text-[11px] text-amber-600 underline shrink-0"
                        onClick={() => { setCurrentView('jobs'); setBoardFilters(f => ({ ...f, favoritesOnly: true, status: 'to_apply' })) }}
                      >
                        View
                      </button>
                    </div>
                  )}

                  {/* AI content ready */}
                  {aiReadyCount > 0 && (
                    <div className="border border-indigo-100 bg-indigo-50/40 rounded-xl p-4 flex items-start gap-3">
                      <Award className="h-4 w-4 text-indigo-400 mt-0.5 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-[13px] font-semibold text-zinc-800">{aiReadyCount} resume{aiReadyCount !== 1 ? 's' : ''} / cover letter{aiReadyCount !== 1 ? 's' : ''} ready</p>
                        <p className="text-[11px] text-zinc-400 mt-0.5">AI-generated documents waiting to send.</p>
                      </div>
                      <button
                        className="text-[11px] text-indigo-600 underline shrink-0"
                        onClick={() => setCurrentView('resumes')}
                      >
                        View
                      </button>
                    </div>
                  )}

                  {/* CTA if no jobs */}
                  {jobs.length === 0 && (
                    <div className="border border-dashed rounded-xl p-6 flex flex-col items-center text-center gap-3">
                      <Brain className="h-7 w-7 text-zinc-300" />
                      <div>
                        <h3 className="text-[14px] font-semibold text-zinc-800">Find your first match</h3>
                        <p className="text-[12px] text-zinc-400 mt-1">Upload your resume to start the AI job search.</p>
                      </div>
                      <Button
                        size="sm"
                        className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-8 text-[12px]"
                        onClick={() => { setCurrentView('jobs'); setTimeout(() => fileInputRef.current?.click(), 100) }}
                      >
                        <Search className="h-3.5 w-3.5" /> Find Jobs with AI
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
            { status: 'to_apply',  label: 'To Apply',     dotColor: STATUS_COLORS.to_apply,  headerBg: 'bg-zinc-50',    headerText: 'text-zinc-600',    headerBorder: 'border-zinc-200' },
            { status: 'applied',   label: 'Applied',      dotColor: STATUS_COLORS.applied,   headerBg: 'bg-blue-50',    headerText: 'text-blue-700',    headerBorder: 'border-blue-200' },
            { status: 'interview', label: 'Interviewing', dotColor: STATUS_COLORS.interview, headerBg: 'bg-amber-50',   headerText: 'text-amber-700',   headerBorder: 'border-amber-200' },
            { status: 'offer',     label: 'Offer',        dotColor: STATUS_COLORS.offer,     headerBg: 'bg-emerald-50', headerText: 'text-emerald-700', headerBorder: 'border-emerald-200' },
            { status: 'rejected',  label: 'Rejected',     dotColor: STATUS_COLORS.rejected,  headerBg: 'bg-red-50/60',  headerText: 'text-red-600',     headerBorder: 'border-red-100' },
            { status: 'ghosted',   label: 'Ghosted',      dotColor: STATUS_COLORS.ghosted,   headerBg: 'bg-zinc-50',    headerText: 'text-zinc-500',    headerBorder: 'border-zinc-100' },
          ]
          return (
            <div className="flex-1 overflow-auto pb-16 md:pb-0">
              <div className="p-4 md:p-6 max-w-5xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-bold tracking-tight">Applications</h2>
                    <p className="text-[13px] text-zinc-400 mt-0.5">
                      {jobs.length > 0 ? `${jobs.length} jobs tracked · ${appliedCount} applied` : 'Track every application from here'}
                    </p>
                  </div>
                  {toApplyCount > 0 && (
                    <Button
                      size="sm"
                      className="gap-1.5 h-8 text-[12px] bg-indigo-600 hover:bg-indigo-700 text-white"
                      onClick={() => { setCurrentView('jobs'); setShowQuickApply(quickApplyQueue.length > 0) }}
                    >
                      <Zap className="h-3.5 w-3.5" /> Start applying ({toApplyCount})
                    </Button>
                  )}
                </div>

                {jobs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-24 text-center">
                    <div className="h-16 w-16 rounded-2xl bg-zinc-50 border border-zinc-100 flex items-center justify-center mb-5">
                      <Send className="h-8 w-8 text-zinc-200" aria-hidden />
                    </div>
                    <h3 className="font-semibold text-zinc-600 text-[15px]">No applications yet</h3>
                    <p className="text-[13px] text-zinc-400 mt-1 max-w-xs">Add jobs from My Jobs and apply to start tracking your progress here.</p>
                    <Button size="sm" className="mt-5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white gap-1.5" onClick={() => setCurrentView('jobs')}>
                      <Plus className="h-3.5 w-3.5" /> Add your first job
                    </Button>
                  </div>
                ) : (
                  <>
                    {/* Pipeline chart */}
                    <div className="border rounded-2xl bg-white p-5 shadow-sm">
                      <h3 className="text-[13px] font-semibold text-zinc-700 mb-4">Your pipeline</h3>
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

                    {/* Status groups */}
                    <div className="space-y-6">
                      {PIPELINE.map(({ status, label, dotColor, headerBg, headerText, headerBorder }) => {
                        const group = jobs.filter(j => j.status === status)
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
                                <button
                                  className="ml-auto text-[11px] text-indigo-500 hover:text-indigo-700 font-medium"
                                  onClick={() => { setCurrentView('jobs'); setShowQuickApply(true) }}
                                >
                                  Start applying →
                                </button>
                              )}
                            </div>
                            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
                              {group.map(j => {
                                const isOverdue = j.followUpAt && j.followUpAt <= today
                                return (
                                  <button
                                    key={j.id}
                                    className={cn(
                                      "border rounded-xl p-3.5 bg-white text-left transition-all group",
                                      "hover:shadow-md hover:border-zinc-300 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400",
                                      isOverdue && "ring-1 ring-amber-300 border-amber-200",
                                    )}
                                    onClick={() => { setSelectedId(j.id); setCurrentView('jobs') }}
                                  >
                                    <div className="flex items-start gap-2.5">
                                      <div className="h-9 w-9 rounded-lg bg-zinc-50 border border-zinc-200 flex items-center justify-center shrink-0 text-[13px] font-bold text-zinc-500 group-hover:border-zinc-300 transition-colors">
                                        {j.company.replace(/^the\s+/i, '')[0]?.toUpperCase() ?? '?'}
                                      </div>
                                      <div className="min-w-0 flex-1">
                                        <div className="flex items-center gap-1.5">
                                          <p className="font-semibold text-[13px] text-zinc-900 truncate leading-snug">{j.title}</p>
                                          {j.favorite && <Star className="h-3 w-3 text-amber-400 fill-amber-400 shrink-0" />}
                                        </div>
                                        <p className="text-[12px] text-zinc-500 mt-0.5 truncate">{j.company}{j.location && j.location !== 'Not specified' ? ` · ${j.location}` : ''}</p>
                                      </div>
                                      {j.matchScore !== undefined && <MatchTierBadge score={j.matchScore} />}
                                    </div>
                                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                                      {j.appliedAt && (
                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600">
                                          ✓ {new Date(j.appliedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </span>
                                      )}
                                      {isOverdue && (
                                        <span className="inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-600 font-medium">
                                          ⏰ Follow-up due
                                        </span>
                                      )}
                                      {j.aiContent?.coverLetter && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-500">CL ✓</span>
                                      )}
                                      {j.aiContent?.tailoredResume && (
                                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-500">Resume ✓</span>
                                      )}
                                    </div>
                                  </button>
                                )
                              })}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </>
                )}
              </div>
            </div>
          )
        })()}

        {/* ── SETTINGS ──────────────────────────────────────────────────── */}
        {currentView === 'settings' && (
          <div className="flex-1 p-4 md:p-8 overflow-auto pb-16 md:pb-0">
            <h2 className="text-xl font-bold tracking-tight mb-6">Settings</h2>
            <div className="space-y-4 max-w-xl">
              <div className="p-5 border rounded-lg bg-white">
                <h3 className="font-semibold text-[14px]">Notifications</h3>
                <p className="text-[13px] text-zinc-400 mt-1">Manage alerts for new jobs and application updates.</p>
                <Button variant="outline" size="sm" className="mt-3 rounded-lg">Configure</Button>
              </div>
              <div className="p-5 border rounded-lg bg-white">
                <h3 className="font-semibold text-[14px]">API Keys &amp; Integrations</h3>
                <p className="text-[13px] text-zinc-400 mt-1">Connect job boards and external services.</p>
                <Button variant="outline" size="sm" className="mt-3 rounded-lg">Manage Keys</Button>
              </div>
              <div className="p-5 border border-red-100 rounded-lg bg-white">
                <h3 className="font-semibold text-[14px] text-red-600">Danger Zone</h3>
                <p className="text-[13px] text-zinc-400 mt-1">Clear all workspace data from local storage.</p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="mt-3 rounded-lg"
                  onClick={() => {
                    if (confirm('Clear all jobs from your workspace? This cannot be undone.')) {
                      localStorage.removeItem('goosejobs_copilot_v1')
                      localStorage.removeItem('gj_onboarded')
                      setJobs([])
                      setSelectedId(null)
                      window.location.href = '/onboarding'
                    }
                  }}
                >
                  Clear Workspace &amp; Re-onboard
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ── INTERVIEWS (coming soon) ───────────────────────────────────── */}
        {currentView === 'interviews' && (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
            <Lock className="h-9 w-9 text-zinc-200 mb-4" aria-hidden />
            <h2 className="text-[15px] font-semibold capitalize tracking-tight">Interviews</h2>
            <p className="text-[13px] text-zinc-400 mt-1">Coming soon.</p>
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
                    <p className="text-[13px] text-zinc-400 mt-0.5">
                      {jobsWithContent.length > 0
                        ? `${jobsWithContent.length} job${jobsWithContent.length !== 1 ? 's' : ''} with AI-generated documents`
                        : 'Generate documents from My Jobs using the AI copilot'}
                    </p>
                  </div>
                  {!masterResumeText && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5 h-8 text-[12px]"
                      onClick={() => resumeOnlyRef.current?.click()}
                    >
                      <FileText className="h-3.5 w-3.5" /> Upload Master Resume
                    </Button>
                  )}
                </div>

                {/* Master resume status */}
                <div className={cn(
                  "rounded-xl border p-4 flex items-center gap-3",
                  masterResumeText ? "border-emerald-200 bg-emerald-50/40" : "border-zinc-200 bg-zinc-50",
                )}>
                  <div className={cn(
                    "h-9 w-9 rounded-lg flex items-center justify-center shrink-0",
                    masterResumeText ? "bg-emerald-100" : "bg-zinc-100",
                  )}>
                    <FileText className="h-4 w-4 text-emerald-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-semibold text-zinc-800">
                      {masterResumeText ? 'Master resume uploaded' : 'No master resume yet'}
                    </p>
                    <p className="text-[11px] text-zinc-400 mt-0.5">
                      {masterResumeText
                        ? `${(masterResumeText.length / 1000).toFixed(1)}k characters · Used to tailor documents for each job`
                        : 'Upload your base resume to generate tailored versions and cover letters'}
                    </p>
                  </div>
                  <button
                    onClick={() => resumeOnlyRef.current?.click()}
                    className="text-[12px] text-indigo-500 hover:text-indigo-700 underline shrink-0"
                  >
                    {masterResumeText ? 'Replace' : 'Upload'}
                  </button>
                </div>

                {/* Content list */}
                {jobsWithContent.length === 0 ? (
                  <div className="border border-dashed rounded-xl p-10 flex flex-col items-center text-center gap-3">
                    <div className="h-12 w-12 rounded-xl bg-zinc-50 border border-zinc-100 flex items-center justify-center">
                      <FileText className="h-6 w-6 text-zinc-300" />
                    </div>
                    <div>
                      <h3 className="text-[14px] font-semibold text-zinc-700">No documents yet</h3>
                      <p className="text-[12px] text-zinc-400 mt-1 max-w-xs">
                        Open any job in My Jobs, go to the Cover Letter or Resume tab, and generate AI-tailored documents.
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg h-8 text-[12px] mt-1"
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
                        <div key={j.id} className="border rounded-xl bg-white overflow-hidden hover:shadow-sm transition-shadow">
                          {/* Job header */}
                          <div className="flex items-center gap-3 px-4 py-3 border-b border-zinc-50">
                            <div className="h-8 w-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                              <span className="text-[11px] font-bold text-zinc-500">
                                {j.company.replace(/^the\s+/i, '')[0]?.toUpperCase() ?? '?'}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[13px] font-semibold text-zinc-900 truncate">{j.title}</p>
                              <p className="text-[11px] text-zinc-400 truncate">{j.company}{j.location && j.location !== 'Not specified' ? ` · ${j.location}` : ''}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                              {hasCL && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-blue-50 border border-blue-100 text-blue-600">Cover Letter</span>
                              )}
                              {hasTR && (
                                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-indigo-50 border border-indigo-100 text-indigo-600">Resume</span>
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
                                  className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-indigo-600 border border-zinc-200 rounded-md px-2 py-1 hover:border-indigo-200 transition-colors"
                                >
                                  <Eye className="h-3 w-3" /> View Cover Letter
                                </button>
                                <button
                                  onClick={() => handleCopy(j.aiContent.coverLetter!, `${j.id}-cl`)}
                                  className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-indigo-600 border border-zinc-200 rounded-md px-2 py-1 hover:border-indigo-200 transition-colors"
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
                                  className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-indigo-600 border border-zinc-200 rounded-md px-2 py-1 hover:border-indigo-200 transition-colors"
                                >
                                  <Eye className="h-3 w-3" /> View Resume
                                </button>
                                <button
                                  onClick={() => handleCopy(j.aiContent.tailoredResume!, `${j.id}-tr`)}
                                  className="inline-flex items-center gap-1 text-[11px] text-zinc-600 hover:text-indigo-600 border border-zinc-200 rounded-md px-2 py-1 hover:border-indigo-200 transition-colors"
                                >
                                  <Copy className="h-3 w-3" />
                                  {copiedKey === `${j.id}-tr` ? 'Copied!' : 'Copy'}
                                </button>
                              </div>
                            )}
                            <button
                              onClick={() => { setSelectedId(j.id); setCurrentView('jobs') }}
                              className="ml-auto inline-flex items-center gap-1 text-[11px] text-zinc-400 hover:text-zinc-700 transition-colors"
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
                    <h3 className="text-[14px] font-semibold text-zinc-800">Search History</h3>
                    <span className="text-[11px] text-zinc-400">{sessions.length} search{sessions.length !== 1 ? 'es' : ''}</span>
                  </div>
                  <div className="space-y-2">
                    {sessions.map(s => {
                      const sessionJobs = jobs.filter(j => j.searchSessionId === s.id)
                      const appliedFromSession = sessionJobs.filter(j => j.appliedAt).length
                      return (
                        <div key={s.id} className="border rounded-xl bg-white p-4 flex items-center gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="text-[13px] font-semibold text-zinc-800 truncate">{s.resumeName}</p>
                              {s.location && (
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-50 border border-zinc-100 text-zinc-400">{s.location}</span>
                              )}
                            </div>
                            <p className="text-[11px] text-zinc-400 mt-0.5">
                              {new Date(s.startedAt).toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' })}
                              {s.completedAt ? ` · ${s.jobCount} jobs found` : ' · In progress…'}
                            </p>
                          </div>
                          <div className="flex items-center gap-4 shrink-0 text-center">
                            <div>
                              <p className="text-[15px] font-bold text-zinc-800 tabular-nums">{sessionJobs.length}</p>
                              <p className="text-[10px] text-zinc-400">in board</p>
                            </div>
                            {appliedFromSession > 0 && (
                              <div>
                                <p className="text-[15px] font-bold text-blue-600 tabular-nums">{appliedFromSession}</p>
                                <p className="text-[10px] text-zinc-400">applied</p>
                              </div>
                            )}
                            <button
                              onClick={() => { setCurrentView('jobs'); setBoardFilters(f => ({ ...f, sessionId: s.id })) }}
                              className="text-[11px] text-indigo-500 hover:text-indigo-700 underline"
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
                    className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[80vh] flex flex-col overflow-hidden"
                    onClick={e => e.stopPropagation()}
                  >
                    <div className="flex items-center justify-between px-5 py-3.5 border-b">
                      <div>
                        <p className="text-[13px] font-semibold text-zinc-900">
                          {previewType === 'coverLetter' ? 'Cover Letter' : 'Tailored Resume'}
                        </p>
                        <p className="text-[11px] text-zinc-400">{previewJob.title} · {previewJob.company}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopy(
                            previewType === 'coverLetter' ? previewJob.aiContent.coverLetter! : previewJob.aiContent.tailoredResume!,
                            `preview-${previewType}`
                          )}
                          className="inline-flex items-center gap-1 text-[12px] text-indigo-600 hover:text-indigo-800 border border-indigo-200 rounded-md px-2.5 py-1 hover:bg-indigo-50 transition-colors"
                        >
                          <Copy className="h-3 w-3" />
                          {copiedKey === `preview-${previewType}` ? 'Copied!' : 'Copy'}
                        </button>
                        <button
                          onClick={() => setPreviewJob(null)}
                          className="h-7 w-7 flex items-center justify-center rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                    <div className="overflow-auto flex-1 p-5">
                      <pre className="text-[12px] text-zinc-700 leading-relaxed whitespace-pre-wrap font-sans">
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
