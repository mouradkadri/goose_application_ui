"use client"

import Image from "next/image"
import { X } from "lucide-react"

interface SearchStatusPillProps {
  logs:      string[]
  onDismiss: () => void
}

/**
 * Global fixed pill shown when a job search is running in background mode.
 * Stays visible across all navigation views so the user always knows the
 * goose is hunting.
 */
export function SearchStatusPill({ logs, onDismiss }: SearchStatusPillProps) {
  const latestLog = logs.length > 0 ? logs[logs.length - 1] : null
  // Trim long log messages so the pill stays compact
  const logSnippet = latestLog
    ? (latestLog.length > 32 ? latestLog.slice(0, 32) + "…" : latestLog)
    : "Starting…"

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={`AI job search in progress: ${logSnippet}`}
      className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-zinc-900 border border-zinc-700 shadow-xl text-white animate-in slide-in-from-bottom-2 fade-in duration-200"
    >
      {/* Goose animation */}
      <Image
        src="/goose.gif"
        alt=""
        width={22}
        height={22}
        priority
        unoptimized
        className="rounded shrink-0"
      />

      {/* Status text */}
      <div className="min-w-0">
        <p className="text-[12px] font-semibold leading-none text-white">Hunting jobs…</p>
        <p className="text-[11px] text-zinc-400 mt-0.5 truncate max-w-[160px]">{logSnippet}</p>
      </div>

      {/* Dismiss */}
      <button
        onClick={onDismiss}
        aria-label="Cancel background search"
        className="ml-1 text-zinc-500 hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 rounded"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  )
}
