"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import { Compass, Search, Loader2, ChevronDown, ChevronUp, ExternalLink, Plus, Building2 } from "lucide-react"
import { CopilotJob } from "@/types/copilot-job"
import { toast } from "sonner"

interface BrowseJob {
  title: string
  company: string
  location: string
  description: string
  apply_url: string
  source: string
  date_posted: string | null
  job_type: string | null
  salary: string | null
  tags: string[]
}

interface BrowseCompany {
  name: string
  ats: string
  job_count: number
  jobs: BrowseJob[]
}

interface DiscoverPanelProps {
  onTrackJob: (job: Partial<CopilotJob>) => void
}

const ATS_COLORS: Record<string, string> = {
  "Greenhouse": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Lever":      "bg-blue-100 text-blue-700 border-blue-200",
  "Ashby":      "bg-violet-100 text-violet-700 border-violet-200",
}

export function DiscoverPanel({ onTrackJob }: DiscoverPanelProps) {
  const [role, setRole] = useState("")
  const [location, setLocation] = useState("")
  const [loading, setLoading] = useState(false)
  const [companies, setCompanies] = useState<BrowseCompany[]>([])
  const [totalJobs, setTotalJobs] = useState(0)
  const [expandedCompany, setExpandedCompany] = useState<string | null>(null)
  const [tracked, setTracked] = useState<Set<string>>(new Set())
  const [atsFilter, setAtsFilter] = useState<string>("All")
  const [hasSearched, setHasSearched] = useState(false)
  const [cacheAgeH, setCacheAgeH] = useState<number | null>(null)

  // Pre-fill role from onboarding prefs
  useEffect(() => {
    try {
      const stored = localStorage.getItem("gj_onboarded")
      if (stored) {
        const prefs = JSON.parse(stored)
        if (prefs.role) setRole(prefs.role)
        if (prefs.location) setLocation(prefs.location)
      }
    } catch { /* ignore */ }
  }, [])

  const search = async () => {
    if (!role.trim()) return
    setLoading(true)
    setHasSearched(true)
    setCompanies([])
    setExpandedCompany(null)
    try {
      const params = new URLSearchParams({ role: role.trim(), location: location.trim() })
      const res = await fetch(`/api/browse/?${params}`)
      if (!res.ok) throw new Error("Search failed")
      const data = await res.json()
      setCompanies(data.companies ?? [])
      setTotalJobs(data.total_jobs ?? 0)
      setCacheAgeH(data.cache_age_h ?? null)
      if (data.companies?.length > 0) setExpandedCompany(data.companies[0].name)
    } catch {
      toast.error("Browse failed — check that the backend is running.")
    } finally {
      setLoading(false)
    }
  }

  const handleTrack = (job: BrowseJob) => {
    const key = `${job.company}:${job.title}`
    onTrackJob({
      title:       job.title,
      company:     job.company,
      location:    job.location ?? "",
      salary:      job.salary ?? "",
      description: job.description ?? "",
      applyUrl:    job.apply_url ?? "",
      source:      "url",
      status:      "to_apply",
      notes:       "",
      favorite:    false,
      aiContent:   {},
    })
    setTracked(prev => new Set(prev).add(key))
    toast.success(`"${job.title}" added to My Jobs`)
  }

  const filteredCompanies = atsFilter === "All"
    ? companies
    : companies.filter(c => c.ats === atsFilter)

  const atsOptions = ["All", ...Array.from(new Set(companies.map(c => c.ats))).sort()]

  return (
    <div className="flex-1 p-4 md:p-8 overflow-auto pb-16 md:pb-0">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-1">
          <Compass className="h-5 w-5 text-indigo-500" />
          <h2 className="text-xl font-bold tracking-tight">Discover</h2>
        </div>
        <p className="text-[13px] text-zinc-400">
          Browse companies actively hiring — pulled directly from Greenhouse, Lever, and Ashby job boards.
          Track any role or generate a cold email in one click.
        </p>
      </div>

      {/* Search bar */}
      <div className="flex gap-2 mb-6 max-w-2xl">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-400 pointer-events-none" />
          <Input
            value={role}
            onChange={e => setRole(e.target.value)}
            onKeyDown={e => e.key === "Enter" && search()}
            placeholder="Role (e.g. Data Engineer)"
            className="pl-8 h-9 text-[13px]"
          />
        </div>
        <Input
          value={location}
          onChange={e => setLocation(e.target.value)}
          onKeyDown={e => e.key === "Enter" && search()}
          placeholder="Location (optional)"
          className="h-9 text-[13px] w-40"
        />
        <Button
          onClick={search}
          disabled={loading || !role.trim()}
          className="h-9 gap-1.5 text-[13px] bg-indigo-600 hover:bg-indigo-700 text-white shrink-0"
        >
          {loading
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Search className="h-3.5 w-3.5" />
          }
          {loading ? "Searching…" : "Search"}
        </Button>
      </div>

      {/* Results */}
      {!hasSearched && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Compass className="h-10 w-10 mb-3 text-zinc-300" />
          <p className="text-sm font-medium">Search to discover companies hiring now</p>
          <p className="text-[12px] mt-1">Results come directly from company job boards — no aggregator middleman</p>
        </div>
      )}

      {hasSearched && !loading && companies.length === 0 && (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-400">
          <Building2 className="h-10 w-10 mb-3 text-zinc-300" />
          <p className="text-sm font-medium">No matching roles found</p>
          <p className="text-[12px] mt-1">Try a broader title like "Engineer" or "Data" or leave location empty</p>
        </div>
      )}

      {companies.length > 0 && (
        <>
          {/* Summary + ATS filter */}
          <div className="flex items-center justify-between mb-4 max-w-3xl">
            <p className="text-[13px] text-zinc-500">
              <span className="font-semibold text-zinc-800">{totalJobs}</span> roles across{" "}
              <span className="font-semibold text-zinc-800">{companies.length}</span> companies
              {cacheAgeH !== null && (
                <span className="ml-2 text-[11px] text-zinc-400">
                  · updated {cacheAgeH < 1 ? "just now" : `${cacheAgeH}h ago`}
                </span>
              )}
            </p>
            <div className="flex gap-1.5">
              {atsOptions.map(opt => (
                <button
                  key={opt}
                  onClick={() => setAtsFilter(opt)}
                  className={cn(
                    "text-[11px] px-2.5 py-1 rounded-full border font-medium transition-colors",
                    atsFilter === opt
                      ? "bg-indigo-600 text-white border-indigo-600"
                      : "bg-white text-zinc-500 border-zinc-200 hover:border-zinc-300"
                  )}
                >
                  {opt}
                </button>
              ))}
            </div>
          </div>

          {/* Company cards */}
          <div className="space-y-3 max-w-3xl">
            {filteredCompanies.map(company => {
              const isOpen = expandedCompany === company.name
              const atsColor = ATS_COLORS[company.ats] ?? "bg-zinc-100 text-zinc-600 border-zinc-200"

              return (
                <div key={company.name} className="border rounded-xl bg-white overflow-hidden">
                  {/* Company header */}
                  <button
                    onClick={() => setExpandedCompany(isOpen ? null : company.name)}
                    className="w-full flex items-center justify-between p-4 hover:bg-zinc-50 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="h-9 w-9 rounded-lg bg-zinc-100 border border-zinc-200 flex items-center justify-center text-sm font-bold text-zinc-600 shrink-0">
                        {company.name.replace(/^the\s+/i, "")[0]?.toUpperCase() ?? "?"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-[14px] text-zinc-900 truncate">{company.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={cn("text-[10px] font-semibold px-1.5 py-0.5 rounded border", atsColor)}>
                            {company.ats}
                          </span>
                          <span className="text-[12px] text-zinc-400">
                            {company.job_count} role{company.job_count !== 1 ? "s" : ""}
                          </span>
                        </div>
                      </div>
                    </div>
                    {isOpen
                      ? <ChevronUp className="h-4 w-4 text-zinc-400 shrink-0" />
                      : <ChevronDown className="h-4 w-4 text-zinc-400 shrink-0" />
                    }
                  </button>

                  {/* Job list */}
                  {isOpen && (
                    <div className="border-t divide-y">
                      {company.jobs.map((job, i) => {
                        const key = `${job.company}:${job.title}`
                        const isTracked = tracked.has(key)
                        const hasDescription = !!(job.description?.trim().length > 150)

                        return (
                          <div key={i} className="flex items-start justify-between gap-3 p-4 hover:bg-zinc-50/50 transition-colors">
                            <div className="min-w-0 flex-1">
                              <p className="text-[13px] font-semibold text-zinc-900 truncate">{job.title}</p>
                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
                                {job.location && (
                                  <span className="text-[11px] text-zinc-400">{job.location}</span>
                                )}
                                {job.job_type && (
                                  <span className="text-[11px] text-zinc-400">· {job.job_type}</span>
                                )}
                                {job.salary && (
                                  <span className="text-[11px] text-zinc-400">· {job.salary}</span>
                                )}
                                {job.date_posted && (
                                  <span className="text-[11px] text-zinc-300">· {job.date_posted}</span>
                                )}
                              </div>
                              {job.tags?.filter(Boolean).length > 0 && (
                                <div className="flex flex-wrap gap-1 mt-1.5">
                                  {job.tags.filter(Boolean).slice(0, 4).map((tag, ti) => (
                                    <span key={ti} className="text-[10px] bg-zinc-100 text-zinc-500 px-1.5 py-0.5 rounded">
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                              {!hasDescription && (
                                <p className="text-[11px] text-amber-600 mt-1">
                                  Limited description — outreach generation unavailable for this role
                                </p>
                              )}
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              {job.apply_url && (
                                <a
                                  href={job.apply_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded border border-zinc-200 text-zinc-500 hover:bg-zinc-100 transition-colors"
                                >
                                  <ExternalLink className="h-3 w-3" /> Apply
                                </a>
                              )}
                              <Button
                                size="sm"
                                variant={isTracked ? "secondary" : "outline"}
                                className={cn("h-7 text-[11px] gap-1", isTracked && "text-emerald-700 border-emerald-200 bg-emerald-50")}
                                onClick={() => !isTracked && handleTrack(job)}
                                disabled={isTracked}
                              >
                                <Plus className="h-3 w-3" />
                                {isTracked ? "Tracked" : "Track"}
                              </Button>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}
