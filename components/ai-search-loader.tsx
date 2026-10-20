"use client"

import { useEffect, useRef } from "react"
import Image from "next/image"
import { CheckCircle2, Loader2, XCircle, ArrowUpRight } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface AiSearchLoaderProps {
  logs:               string[]
  jobCount:           number | null
  error:              string | null
  onDone:             () => void
  onDismissError:     () => void
  /** When provided, shows a "Run in background" button while searching */
  onRunInBackground?: () => void
}

export function AiSearchLoader({
  logs,
  jobCount,
  error,
  onDone,
  onDismissError,
  onRunInBackground,
}: AiSearchLoaderProps) {
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFinished  = jobCount !== null
  const hasError    = error !== null
  const isRunning   = !isFinished && !hasError
  const isNoResults = isFinished && jobCount === 0

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  return (
    <div
      role="dialog"
      aria-label={hasError ? "Search failed" : isFinished ? "Search complete" : "Searching for jobs"}
      className="absolute inset-0 z-30 flex items-center justify-center bg-paper/96 backdrop-blur-md"
    >
      <div className="w-full max-w-sm mx-auto px-6 flex flex-col items-center gap-6">

        {/* Visual: goose gif (running) / checkmark (done) / x (error) */}
        <div className="relative flex flex-col items-center">
          {hasError ? (
            <div className="h-16 w-16 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-red-500" />
            </div>
          ) : isFinished && !isNoResults ? (
            <div className="h-16 w-16 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-500" />
            </div>
          ) : isNoResults ? (
            <div className="h-16 w-16 rounded-full bg-paper-2 border border-line flex items-center justify-center">
              <span className="text-2xl select-none">🦆</span>
            </div>
          ) : (
            /* Goose animation while running */
            <div className="rounded-md overflow-hidden">
              <Image
                src="/goose.gif"
                alt="Hunting for your best matches…"
                width={88}
                height={88}
                priority
                unoptimized
              />
            </div>
          )}
        </div>

        {/* Heading + sub */}
        <div className="text-center">
          {hasError ? (
            <>
              <p className="text-[15px] font-semibold tracking-tight text-ink">Search failed</p>
              <p className="text-[13px] text-stone mt-1 leading-relaxed max-w-xs">{error}</p>
            </>
          ) : isNoResults ? (
            <>
              <p className="text-[15px] font-semibold tracking-tight text-ink">No matches found</p>
              <p className="text-[13px] text-stone mt-1 leading-relaxed max-w-xs">
                Try <strong>Remote (worldwide)</strong> or another supported region and search again.
              </p>
            </>
          ) : isFinished ? (
            <>
              <p className="text-[15px] font-semibold tracking-tight text-ink">
                Found {jobCount} matching {jobCount === 1 ? "job" : "jobs"}
              </p>
              <p className="text-[13px] text-stone mt-1">Your workspace is ready.</p>
            </>
          ) : (
            <>
              <p className="text-[15px] font-semibold tracking-tight text-ink">Hunting for your best matches</p>
              <p className="text-[13px] text-stone mt-1">This usually takes 1–2 minutes.</p>
            </>
          )}
        </div>

        {/* SSE log list */}
        <div
          role="log"
          aria-live="polite"
          aria-label="Search progress"
          className="w-full max-h-44 overflow-y-auto rounded-lg bg-paper-2 border border-line p-3 space-y-1.5"
        >
          {logs.map((log, i) => {
            const isLast = i === logs.length - 1 && isRunning
            return (
              <div
                key={i}
                className={cn(
                  "flex items-start gap-2.5 text-[13px]",
                  "animate-in fade-in slide-in-from-bottom-1 duration-200",
                )}
              >
                {isLast ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-brand-500 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
                )}
                <span className={cn(
                  "leading-snug",
                  isLast ? "text-ink-soft font-medium" : "text-stone/70",
                )}>
                  {log}
                </span>
              </div>
            )
          })}
          {logs.length === 0 && (
            <div className="flex items-center gap-2.5 text-[13px] text-stone/70">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-400" />
              <span>Starting up…</span>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Actions */}
        {isFinished && !isNoResults && (
          <Button
            onClick={onDone}
            className="w-full bg-brand-600 hover:bg-brand-700 text-white rounded-lg h-9 text-[13px] font-semibold tracking-tight transition-colors"
          >
            View {jobCount} {jobCount === 1 ? "Job" : "Jobs"}
          </Button>
        )}

        {isNoResults && (
          <Button
            variant="outline"
            onClick={onDismissError}
            className="w-full rounded-lg h-9 text-[13px]"
          >
            Dismiss
          </Button>
        )}

        {hasError && (
          <Button
            variant="outline"
            onClick={onDismissError}
            className="w-full rounded-lg h-9 text-[13px]"
          >
            Dismiss
          </Button>
        )}

        {/* Run in background — only while actively searching */}
        {isRunning && onRunInBackground && (
          <button
            onClick={onRunInBackground}
            className="flex items-center gap-1.5 text-[12px] text-stone/70 hover:text-stone transition-colors -mt-2"
          >
            <ArrowUpRight className="h-3.5 w-3.5" />
            Run in background
          </button>
        )}
      </div>
    </div>
  )
}
