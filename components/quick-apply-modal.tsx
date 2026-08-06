"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CopilotJob, STATUS_COLORS } from "@/types/copilot-job"
import { ExternalLink, ChevronRight, SkipForward, CheckCircle2, MapPin, Banknote } from "lucide-react"
import { cn } from "@/lib/utils"

interface QuickApplyModalProps {
  jobs: CopilotJob[]
  onApplied: (jobId: string) => void
  onClose: () => void
}

export function QuickApplyModal({ jobs, onApplied, onClose }: QuickApplyModalProps) {
  const [index, setIndex] = useState(0)
  const [appliedIds, setAppliedIds] = useState<string[]>([])
  const [skippedIds, setSkippedIds] = useState<string[]>([])

  const done = index >= jobs.length
  const job = jobs[index] ?? null
  const totalDone = appliedIds.length + skippedIds.length

  const handleApplied = () => {
    if (!job) return
    onApplied(job.id)
    setAppliedIds(prev => [...prev, job.id])
    setIndex(i => i + 1)
  }

  const handleSkip = () => {
    if (!job) return
    setSkippedIds(prev => [...prev, job.id])
    setIndex(i => i + 1)
  }

  const handleOpenAndApply = () => {
    if (!job?.applyUrl) return
    window.open(job.applyUrl, '_blank')
    // Prompt applied after a moment so the tab has time to open
    setTimeout(() => {
      // The dialog stays open; user clicks "Applied" button
    }, 300)
  }

  const hasSalary = job?.salary && !['not specified', 'competitive', ''].includes((job.salary ?? '').toLowerCase())

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center justify-between">
            <span>Quick Apply</span>
            <span className="text-[12px] font-normal text-zinc-400">
              {done ? `${appliedIds.length} applied · ${skippedIds.length} skipped` : `${index + 1} of ${jobs.length}`}
            </span>
          </DialogTitle>
        </DialogHeader>

        {done ? (
          /* Done state */
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <div>
              <p className="font-semibold text-zinc-900">Session complete!</p>
              <p className="text-[13px] text-zinc-500 mt-1">
                Applied to <span className="font-semibold text-emerald-600">{appliedIds.length}</span> job{appliedIds.length !== 1 ? 's' : ''} ·{' '}
                skipped <span className="font-semibold text-zinc-500">{skippedIds.length}</span>
              </p>
            </div>
            <Button size="sm" onClick={onClose} className="mt-2 bg-indigo-600 hover:bg-indigo-700 text-white">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-zinc-100 overflow-hidden">
              <div
                className="h-full bg-indigo-500 transition-all duration-300 rounded-full"
                style={{ width: `${(index / jobs.length) * 100}%` }}
              />
            </div>

            {/* Job card */}
            <div className="rounded-lg border border-zinc-200 p-4 space-y-2">
              <div className="flex items-start gap-2">
                {/* Company avatar */}
                <div className="h-8 w-8 rounded-md bg-zinc-100 border border-zinc-200 flex items-center justify-center shrink-0">
                  <span className="text-[12px] font-bold text-zinc-500">
                    {job.company.replace(/^the\s+/i, '').trim()[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-zinc-900 leading-snug">{job.title}</p>
                  <p className="text-[12px] text-zinc-500 mt-0.5">{job.company}</p>
                </div>
                <div className={cn("h-2 w-2 rounded-full shrink-0 mt-1", STATUS_COLORS[job.status])} />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {job.location && job.location !== 'Not specified' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-50 border border-zinc-100 text-[11px] text-zinc-500">
                    <MapPin className="h-2.5 w-2.5" />{job.location}
                  </span>
                )}
                {hasSalary && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 border border-emerald-100 text-[11px] text-emerald-600">
                    <Banknote className="h-2.5 w-2.5" />{job.salary}
                  </span>
                )}
              </div>

              {job.description && (
                <p className="text-[12px] text-zinc-400 leading-relaxed line-clamp-3">
                  {job.description.slice(0, 280)}
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {job.applyUrl ? (
                <Button
                  className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                  onClick={handleOpenAndApply}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open & Apply
                </Button>
              ) : (
                <p className="text-[12px] text-zinc-400 text-center">No apply URL — mark as applied manually.</p>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-1.5 border-emerald-200 text-emerald-700 hover:bg-emerald-50"
                  onClick={handleApplied}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" /> Applied
                  <ChevronRight className="h-3 w-3 ml-auto opacity-50" />
                </Button>
                <Button
                  variant="ghost"
                  className="flex-1 gap-1.5 text-zinc-500"
                  onClick={handleSkip}
                >
                  <SkipForward className="h-3.5 w-3.5" /> Skip
                </Button>
              </div>
            </div>

            {/* Remaining count hint */}
            {jobs.length - index - 1 > 0 && (
              <p className="text-[11px] text-center text-zinc-400">
                {jobs.length - index - 1} more job{jobs.length - index - 1 !== 1 ? 's' : ''} in queue
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
