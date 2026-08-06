"use client"

import { useRef } from "react"
import { Search, Star, X, Play } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CopilotJob, JobStatus, STATUS_LABELS } from "@/types/copilot-job"
import { cn } from "@/lib/utils"

export type SortKey = 'newest' | 'match' | 'company' | 'applied'

export interface BoardFilters {
  search: string
  status: JobStatus | 'all'
  favoritesOnly: boolean
  sort: SortKey
  sessionId: string | 'all'
}

export const DEFAULT_FILTERS: BoardFilters = {
  search: '',
  status: 'all',
  favoritesOnly: false,
  sort: 'newest',
  sessionId: 'all',
}

export interface SearchSessionSummary {
  id: string
  resumeName: string
  location: string | null
  startedAt: string
  jobCount: number
}

interface JobBoardToolbarProps {
  filters: BoardFilters
  onChange: (f: BoardFilters) => void
  totalJobs: number
  visibleCount: number
  onStartApplying?: () => void
  searchInputRef?: React.RefObject<HTMLInputElement | null>
  sessions?: SearchSessionSummary[]
}

const SORT_LABELS: Record<SortKey, string> = {
  newest: 'Newest',
  match: 'Match score',
  company: 'Company A–Z',
  applied: 'Applied date',
}

export function applyFilters(jobs: CopilotJob[], filters: BoardFilters): CopilotJob[] {
  let result = [...jobs]

  if (filters.search.trim()) {
    const q = filters.search.toLowerCase()
    result = result.filter(j =>
      j.title.toLowerCase().includes(q) ||
      j.company.toLowerCase().includes(q) ||
      j.location.toLowerCase().includes(q)
    )
  }

  if (filters.status !== 'all') {
    result = result.filter(j => j.status === filters.status)
  }

  if (filters.favoritesOnly) {
    result = result.filter(j => j.favorite)
  }

  if (filters.sessionId !== 'all') {
    result = result.filter(j => j.searchSessionId === filters.sessionId)
  }

  switch (filters.sort) {
    case 'match':
      result.sort((a, b) => (b.matchScore ?? -1) - (a.matchScore ?? -1))
      break
    case 'company':
      result.sort((a, b) => a.company.localeCompare(b.company))
      break
    case 'applied':
      result.sort((a, b) => {
        if (!a.appliedAt && !b.appliedAt) return 0
        if (!a.appliedAt) return 1
        if (!b.appliedAt) return -1
        return b.appliedAt.localeCompare(a.appliedAt)
      })
      break
    case 'newest':
    default:
      result.sort((a, b) => b.addedAt.localeCompare(a.addedAt))
      break
  }

  return result
}

export function JobBoardToolbar({
  filters,
  onChange,
  totalJobs,
  visibleCount,
  onStartApplying,
  searchInputRef,
  sessions = [],
}: JobBoardToolbarProps) {
  const internalRef = useRef<HTMLInputElement>(null)
  const ref = (searchInputRef as React.RefObject<HTMLInputElement>) ?? internalRef

  const set = (partial: Partial<BoardFilters>) => onChange({ ...filters, ...partial })
  const hasActiveFilter = filters.status !== 'all' || filters.favoritesOnly || filters.search.trim() || filters.sessionId !== 'all'

  return (
    <div className="border-b bg-white px-2 py-1.5 space-y-1.5">
      {/* Search row */}
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1">
          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-400 pointer-events-none" />
          <input
            ref={ref}
            type="text"
            placeholder="Search jobs…"
            value={filters.search}
            onChange={e => set({ search: e.target.value })}
            aria-label="Search jobs by title, company or location"
            className={cn(
              "w-full pl-6 pr-2 py-1.5 text-[12px] rounded-md border border-zinc-200",
              "bg-zinc-50 outline-none focus:border-indigo-300 focus:bg-white focus:ring-1 focus:ring-indigo-200",
              "transition-colors placeholder:text-zinc-400",
            )}
          />
          {filters.search && (
            <button
              onClick={() => set({ search: '' })}
              className="absolute right-1.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600"
              aria-label="Clear search"
            >
              <X className="h-3 w-3" />
            </button>
          )}
        </div>

        {/* Favorites toggle */}
        <button
          onClick={() => set({ favoritesOnly: !filters.favoritesOnly })}
          aria-pressed={filters.favoritesOnly}
          aria-label="Show favorites only"
          title="Favorites only"
          className={cn(
            "h-[30px] w-[30px] flex items-center justify-center rounded-md border transition-colors shrink-0",
            filters.favoritesOnly
              ? "border-amber-300 bg-amber-50 text-amber-500"
              : "border-zinc-200 text-zinc-400 hover:text-amber-500 hover:border-amber-200",
          )}
        >
          <Star className={cn("h-3.5 w-3.5", filters.favoritesOnly && "fill-amber-400")} />
        </button>
      </div>

      {/* Filter chips row */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {/* Status filter */}
        <Select value={filters.status} onValueChange={v => set({ status: v as JobStatus | 'all' })}>
          <SelectTrigger
            className={cn(
              "h-7 w-[115px] text-[11px] font-medium rounded-md px-2 border transition-colors",
              filters.status !== 'all'
                ? "border-indigo-300 text-indigo-700 bg-indigo-50"
                : "border-zinc-200 text-zinc-500 bg-white",
            )}
          >
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent className="text-[12px]">
            <SelectItem value="all" className="text-[12px]">All statuses</SelectItem>
            {(Object.entries(STATUS_LABELS) as [JobStatus, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-[12px]">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Sort */}
        <Select value={filters.sort} onValueChange={v => set({ sort: v as SortKey })}>
          <SelectTrigger
            className={cn(
              "h-7 w-[110px] text-[11px] font-medium rounded-md px-2 border transition-colors",
              filters.sort !== 'newest'
                ? "border-indigo-300 text-indigo-700 bg-indigo-50"
                : "border-zinc-200 text-zinc-500 bg-white",
            )}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="text-[12px]">
            {(Object.entries(SORT_LABELS) as [SortKey, string][]).map(([k, v]) => (
              <SelectItem key={k} value={k} className="text-[12px]">{v}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Session filter — only shown when there are multiple AI search sessions */}
        {sessions.length > 1 && (
          <Select value={filters.sessionId} onValueChange={v => set({ sessionId: v })}>
            <SelectTrigger
              className={cn(
                "h-7 w-[120px] text-[11px] font-medium rounded-md px-2 border transition-colors",
                filters.sessionId !== 'all'
                  ? "border-indigo-300 text-indigo-700 bg-indigo-50"
                  : "border-zinc-200 text-zinc-500 bg-white",
              )}
            >
              <SelectValue placeholder="All searches" />
            </SelectTrigger>
            <SelectContent className="text-[12px] max-w-[220px]">
              <SelectItem value="all" className="text-[12px]">All searches</SelectItem>
              {sessions.map(s => (
                <SelectItem key={s.id} value={s.id} className="text-[12px]">
                  <div className="flex flex-col leading-snug max-w-[180px]">
                    <span className="truncate font-medium">{s.resumeName.replace(/\.[^.]+$/, '')}</span>
                    <span className="text-[10px] text-zinc-400">
                      {new Date(s.startedAt).toLocaleDateString()} · {s.jobCount} jobs{s.location ? ` · ${s.location}` : ''}
                    </span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Clear filters */}
        {hasActiveFilter && (
          <button
            onClick={() => onChange({ ...DEFAULT_FILTERS, sort: filters.sort })}
            className="text-[11px] text-zinc-400 hover:text-zinc-600 underline flex items-center gap-0.5"
          >
            <X className="h-2.5 w-2.5" /> Clear
          </button>
        )}

        {/* Result count */}
        {hasActiveFilter && (
          <span className="text-[11px] text-zinc-400 ml-auto">
            {visibleCount} / {totalJobs}
          </span>
        )}
      </div>

      {/* Quick-apply CTA */}
      {onStartApplying && (
        <Button
          size="sm"
          variant="outline"
          className="w-full h-7 text-[12px] gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-300"
          onClick={onStartApplying}
        >
          <Play className="h-3 w-3 fill-emerald-600 text-emerald-600" />
          Start applying
        </Button>
      )}
    </div>
  )
}
