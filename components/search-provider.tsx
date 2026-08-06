"use client"

import {
  createContext, useContext, useState, useCallback, useRef, ReactNode,
} from "react"
import { toast } from "sonner"
import { useJobSearchStream, LocationPrefs, RawSearchJob } from "@/lib/use-job-search-stream"
import { copilotStore, RawApiJob } from "@/lib/copilot-store"
import { searchSessions } from "@/lib/search-sessions"
import { SearchStatusPill } from "@/components/search-status-pill"

// ── Types ─────────────────────────────────────────────────────────────────────

export type SearchStatus = "idle" | "running" | "done" | "error"
export type SearchMode   = "overlay" | "background"

interface SearchContextValue {
  status:     SearchStatus
  mode:       SearchMode
  logs:       string[]
  jobCount:   number | null
  error:      string | null
  firstJobId: string | null
  startSearch: (file: File, locationPrefs: LocationPrefs | null) => void
  goBackground: () => void
  dismiss:    () => void
}

// ── Context ───────────────────────────────────────────────────────────────────

const SearchContext = createContext<SearchContextValue | null>(null)

export function useSearch(): SearchContextValue {
  const ctx = useContext(SearchContext)
  if (!ctx) throw new Error("useSearch must be used within <SearchProvider>")
  return ctx
}

// ── Provider ──────────────────────────────────────────────────────────────────

export function SearchProvider({ children }: { children: ReactNode }) {
  const [status,     setStatus]     = useState<SearchStatus>("idle")
  const [mode,       setMode]       = useState<SearchMode>("overlay")
  const [logs,       setLogs]       = useState<string[]>([])
  const [jobCount,   setJobCount]   = useState<number | null>(null)
  const [error,      setError]      = useState<string | null>(null)
  const [firstJobId, setFirstJobId] = useState<string | null>(null)

  const { startStream } = useJobSearchStream()

  // Track current mode inside the async callback without stale closure
  const modeRef = useRef<SearchMode>("overlay")

  const dismiss = useCallback(() => {
    setStatus("idle")
    setMode("overlay")
    modeRef.current = "overlay"
    setLogs([])
    setJobCount(null)
    setError(null)
    setFirstJobId(null)
  }, [])

  const goBackground = useCallback(() => {
    setMode("background")
    modeRef.current = "background"
  }, [])

  const startSearch = useCallback((file: File, locationPrefs: LocationPrefs | null) => {
    // Generate a session ID for this search run — stamped on every resulting job
    const sessionId = crypto.randomUUID()
    searchSessions.save({
      id: sessionId,
      resumeName: file.name,
      location: locationPrefs?.label ?? null,
      startedAt: new Date().toISOString(),
      jobCount: 0,
    })

    // Reset then start
    setStatus("running")
    setMode("overlay")
    modeRef.current = "overlay"
    setLogs([])
    setJobCount(null)
    setError(null)
    setFirstJobId(null)

    startStream(file, locationPrefs, {
      onStep: (msg) => setLogs((prev) => [...prev, msg]),

      onDone: async (rawJobs: RawSearchJob[], count: number) => {
        // Mark session complete
        searchSessions.complete(sessionId, count)
        // Sync to server (deduped) and update local store, stamping sessionId on each job
        const all = await copilotStore.syncFromSearch(rawJobs as RawApiJob[], sessionId)
        const fid = all[0]?.id ?? null
        setFirstJobId(fid)

        if (modeRef.current === "background") {
          // Fire a DOM event so the workspace page can refresh its job list
          window.dispatchEvent(new CustomEvent("goosejobs:search-done", {
            detail: { firstJobId: fid, count },
          }))
          // Toast with a "View Jobs" action
          toast.success(
            count === 0
              ? "No matching jobs found"
              : `Found ${count} matching ${count === 1 ? "job" : "jobs"}`,
            {
              description: count === 0
                ? "Try Remote (worldwide) or another supported region."
                : "Your workspace has been updated.",
              action: count > 0 ? {
                label: "View Jobs",
                onClick: () => window.dispatchEvent(new CustomEvent("goosejobs:view-jobs", {
                  detail: { firstJobId: fid },
                })),
              } : undefined,
              duration: 8000,
            },
          )
          // Auto-dismiss so the pill hides
          setStatus("idle")
          setMode("overlay")
          modeRef.current = "overlay"
          setLogs([])
          setJobCount(null)
          setFirstJobId(null)
        } else {
          setJobCount(count)
          setStatus("done")
        }
      },

      onError: (msg: string) => {
        if (modeRef.current === "background") {
          toast.error("Search failed", { description: msg })
          // Auto-dismiss
          setStatus("idle")
          setMode("overlay")
          modeRef.current = "overlay"
          setLogs([])
          setError(null)
        } else {
          setError(msg)
          setStatus("error")
        }
      },
    })
  }, [startStream])

  // Show pill globally when running in background
  const showPill = mode === "background" && status === "running"

  return (
    <SearchContext.Provider value={{
      status, mode, logs, jobCount, error, firstJobId,
      startSearch, goBackground, dismiss,
    }}>
      {children}
      {showPill && (
        <SearchStatusPill logs={logs} onDismiss={dismiss} />
      )}
    </SearchContext.Provider>
  )
}
