"use client"

import { useCallback } from "react"

export interface LocationPrefs {
  label: string
  country_code: string | null
  remote: boolean
}

// Minimal shape expected from the backend 'done' payload
export type RawSearchJob = Record<string, unknown>

interface StreamCallbacks {
  onStep: (msg: string) => void
  onDone: (rawJobs: RawSearchJob[], count: number) => void
  onError: (msg: string) => void
}

/**
 * Shared SSE parsing hook — extracts the fetch + ReadableStream logic used
 * by both the workspace AI search and the onboarding loading step.
 */
export function useJobSearchStream() {
  const startStream = useCallback(async (
    file: File,
    locationPrefs: LocationPrefs | null,
    callbacks: StreamCallbacks,
  ) => {
    const formData = new FormData()
    formData.append("resume_file", file)

    if (locationPrefs) {
      if (locationPrefs.remote) {
        formData.append("is_remote", "true")
        formData.append("location", "Remote")
        formData.append("country_code", "US")
      } else if (locationPrefs.country_code) {
        formData.append("location", locationPrefs.label)
        formData.append("country_code", locationPrefs.country_code)
      }
    }

    // Map onboarding seniority → backend experience_level
    try {
      const stored = localStorage.getItem("gj_onboarded")
      if (stored) {
        const prefs = JSON.parse(stored) as { seniority?: string }
        const map: Record<string, string> = {
          "Junior": "entry", "Mid-level": "mid",
          "Senior": "senior", "Lead": "executive", "Any": "mid",
        }
        const level = map[prefs.seniority ?? ""] ?? "mid"
        formData.append("experience_level", level)
      }
    } catch { /* ignore */ }

    try {
      const response = await fetch("/api/find-jobs-stream/", { method: "POST", body: formData })
      if (!response.body) throw new Error("No response body from server")

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        buffer += decoder.decode(value, { stream: true })

        const parts = buffer.split("\n\n")
        buffer = parts.pop() ?? ""

        for (const chunk of parts) {
          const dataLine = chunk.split("\n").find((l) => l.startsWith("data: "))
          if (!dataLine) continue
          try {
            const payload = JSON.parse(dataLine.slice(6)) as {
              type: string
              msg?: string
              jobs?: RawSearchJob[]
              count?: number
            }
            if (payload.type === "step") {
              callbacks.onStep(payload.msg ?? "")
            } else if (payload.type === "done") {
              callbacks.onDone(payload.jobs ?? [], payload.count ?? 0)
            } else if (payload.type === "error") {
              callbacks.onError(payload.msg ?? "Unknown error")
            }
          } catch {
            // skip malformed SSE chunk
          }
        }
      }
    } catch (e) {
      callbacks.onError(e instanceof Error ? e.message : "Connection failed")
    }
  }, [])

  return { startStream }
}
