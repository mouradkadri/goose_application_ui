"use client"

import { useState, useEffect } from "react"
import { Inbox, X, ArrowRight, Sparkles } from "lucide-react"
import { cn } from "@/lib/utils"

const STORAGE_KEY = "gj_digest_nudge_dismissed"
const DISMISS_TTL_MS = 7 * 24 * 60 * 60 * 1000 // 7 days

interface DigestNudgeProps {
  /** Called when the user clicks the CTA — navigate to settings */
  onNavigateToSettings: () => void
  /** Only show when job count is high enough to make the feature worthwhile */
  jobCount: number
  /** Compact one-liner variant for tight spaces (jobs view banner) */
  compact?: boolean
  className?: string
}

export function DigestNudge({ onNavigateToSettings, jobCount, compact = false, className }: DigestNudgeProps) {
  const [visible, setVisible] = useState(false)
  const [digestEnabled, setDigestEnabled] = useState<boolean | null>(null)

  useEffect(() => {
    // Only show if user has enough jobs to benefit
    if (jobCount < 3) return

    // Respect the dismiss cooldown
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const ts = Number(raw)
        if (!Number.isNaN(ts) && Date.now() - ts < DISMISS_TTL_MS) return
      }
    } catch { /* ignore */ }

    // Check digest status — if already enabled with locations, no nudge needed
    fetch('/api/digest/preferences', { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data) return // not logged in — no nudge
        const isActive = data.enabled && data.locations?.length > 0
        setDigestEnabled(isActive)
        if (!isActive) setVisible(true)
      })
      .catch(() => {})
  }, [jobCount])

  const dismiss = () => {
    setVisible(false)
    try { localStorage.setItem(STORAGE_KEY, String(Date.now())) } catch { /* ignore */ }
  }

  if (!visible || digestEnabled) return null

  if (compact) {
    return (
      <div className={cn(
        "flex items-center justify-between gap-3 px-4 py-2",
        "bg-brand-50 border-b border-brand-100",
        className,
      )}>
        <div className="flex items-center gap-2 min-w-0">
          <Inbox className="h-3.5 w-3.5 text-brand-600 shrink-0" />
          <span className="text-[12px] text-brand-700 font-medium truncate">
            Get your top jobs emailed each morning —
          </span>
          <button
            onClick={onNavigateToSettings}
            className="text-[12px] text-brand-600 font-semibold hover:text-brand-800 shrink-0 flex items-center gap-0.5"
          >
            Set up digest <ArrowRight className="h-3 w-3 inline" />
          </button>
        </div>
        <button onClick={dismiss} aria-label="Dismiss" className="text-brand-300 hover:text-brand-600 shrink-0">
          <X className="h-3.5 w-3.5" />
        </button>
      </div>
    )
  }

  return (
    <div className={cn(
      "rounded-xl border-2 border-brand-200 bg-gradient-to-br from-brand-50 to-paper p-5 space-y-3",
      "relative overflow-hidden",
      className,
    )}>
      {/* Decorative streak */}
      <div className="absolute top-0 right-0 w-32 h-32 bg-brand-100/40 rounded-full -translate-y-1/2 translate-x-1/2 pointer-events-none" />

      <div className="flex items-start justify-between gap-3 relative">
        <div className="flex items-start gap-3">
          <div className="h-9 w-9 rounded-lg bg-brand-100 flex items-center justify-center shrink-0">
            <Inbox className="h-5 w-5 text-brand-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-[14px] font-bold text-ink">Set up your Daily Digest</h4>
              <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-brand-100 text-brand-700 border border-brand-200">
                New
              </span>
            </div>
            <p className="text-[12px] text-stone mt-0.5 leading-relaxed max-w-xs">
              Receive a ranked Excel of your top matches every morning — automatically scored against your resume.
            </p>
          </div>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss digest nudge"
          className="text-stone/40 hover:text-stone transition-colors shrink-0 mt-0.5"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-2 ml-12">
        <div className="flex items-center gap-1.5 text-[11px] text-stone/70">
          <Sparkles className="h-3 w-3 text-brand-400" />
          <span>AI-ranked · Excel format · 1-minute setup</span>
        </div>
      </div>

      <div className="flex items-center gap-3 ml-12">
        <button
          onClick={() => { dismiss(); onNavigateToSettings() }}
          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-brand-600 hover:bg-brand-700 text-white text-[12px] font-semibold transition-colors"
        >
          Configure digest <ArrowRight className="h-3.5 w-3.5" />
        </button>
        <button
          onClick={dismiss}
          className="text-[12px] text-stone hover:text-ink-soft transition-colors"
        >
          Maybe later
        </button>
      </div>
    </div>
  )
}
