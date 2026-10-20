"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { CopilotJob, STATUS_COLORS } from "@/types/copilot-job"
import { ExternalLink, ChevronRight, SkipForward, CheckCircle2, MapPin, Banknote, FileText, FileDown, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import { renderResumePdf, renderCoverLetterPdf } from "@/lib/doc-export-pdf"
import { downloadBlob, safeFilename } from "@/lib/doc-export"

interface QuickApplyModalProps {
  jobs: CopilotJob[]
  onApplied: (jobId: string) => void
  onClose: () => void
}

function getResumeText(): string {
  try {
    const stored = localStorage.getItem("gj_onboarded")
    if (stored) return (JSON.parse(stored) as { resumeText?: string }).resumeText ?? ""
  } catch { /* ignore */ }
  return ""
}

export function QuickApplyModal({ jobs, onApplied, onClose }: QuickApplyModalProps) {
  const [index, setIndex] = useState(0)
  const [appliedIds, setAppliedIds] = useState<string[]>([])
  const [skippedIds, setSkippedIds] = useState<string[]>([])
  const [cvLoading, setCvLoading] = useState(false)
  const [resumeLoading, setResumeLoading] = useState(false)

  const done = index >= jobs.length
  const job = jobs[index] ?? null

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
  }

  const handleCoverLetterPdf = async () => {
    if (!job) return
    const resumeText = getResumeText()
    if (!resumeText) { toast.error("Resume text not found — complete onboarding first"); return }
    setCvLoading(true)
    try {
      const res = await fetch("/api/generate/cover-letter/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: job.description ?? "",
          job_title: job.title,
          company: job.company,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { cover_letter: string }
      const blob = await renderCoverLetterPdf(data.cover_letter, { company: job.company, jobTitle: job.title })
      downloadBlob(blob, safeFilename(job.company, job.title) + "_cover_letter.pdf")
    } catch (e) {
      toast.error("Cover letter generation failed")
      console.error(e)
    } finally {
      setCvLoading(false)
    }
  }

  const handleResumePdf = async () => {
    if (!job) return
    const resumeText = getResumeText()
    if (!resumeText) { toast.error("Resume text not found — complete onboarding first"); return }
    setResumeLoading(true)
    try {
      const res = await fetch("/api/generate/resume-document/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          resume_text: resumeText,
          job_description: job.description ?? "",
          job_title: job.title,
          company: job.company,
        }),
      })
      if (!res.ok) throw new Error(await res.text())
      const data = await res.json() as { resume: Parameters<typeof renderResumePdf>[0] }
      const blob = await renderResumePdf(data.resume)
      downloadBlob(blob, safeFilename(job.company, job.title) + "_resume.pdf")
    } catch (e) {
      toast.error("Resume generation failed")
      console.error(e)
    } finally {
      setResumeLoading(false)
    }
  }

  const hasSalary = job?.salary && !['not specified', 'competitive', ''].includes((job.salary ?? '').toLowerCase())

  return (
    <Dialog open onOpenChange={open => { if (!open) onClose() }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold flex items-center justify-between">
            <span>Quick Apply</span>
            <span className="text-[12px] font-normal text-stone/70">
              {done ? `${appliedIds.length} applied · ${skippedIds.length} skipped` : `${index + 1} of ${jobs.length}`}
            </span>
          </DialogTitle>
        </DialogHeader>

        {done ? (
          <div className="py-6 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="h-10 w-10 text-emerald-500" />
            <div>
              <p className="font-semibold text-ink">Session complete!</p>
              <p className="text-[13px] text-stone mt-1">
                Applied to <span className="font-semibold text-emerald-600">{appliedIds.length}</span> job{appliedIds.length !== 1 ? 's' : ''} ·{' '}
                skipped <span className="font-semibold text-stone">{skippedIds.length}</span>
              </p>
            </div>
            <Button size="sm" onClick={onClose} className="mt-2 bg-brand-600 hover:bg-brand-700 text-white">
              Close
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Progress bar */}
            <div className="w-full h-1 rounded-full bg-paper-2 overflow-hidden">
              <div
                className="h-full bg-brand-500 transition-all duration-300 rounded-full"
                style={{ width: `${(index / jobs.length) * 100}%` }}
              />
            </div>

            {/* Job card */}
            <div className="rounded-lg border border-line p-4 space-y-2">
              <div className="flex items-start gap-2">
                <div className="h-8 w-8 rounded-md bg-paper-2 border border-line flex items-center justify-center shrink-0">
                  <span className="text-[12px] font-bold text-stone">
                    {job.company.replace(/^the\s+/i, '').trim()[0]?.toUpperCase() ?? '?'}
                  </span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[14px] font-semibold text-ink leading-snug">{job.title}</p>
                  <p className="text-[12px] text-stone mt-0.5">{job.company}</p>
                </div>
                <div className={cn("h-2 w-2 rounded-full shrink-0 mt-1", STATUS_COLORS[job.status])} />
              </div>

              <div className="flex flex-wrap gap-1.5">
                {job.location && job.location !== 'Not specified' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-paper-2 border border-line text-[11px] text-stone">
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
                <p className="text-[12px] text-stone/70 leading-relaxed line-clamp-3">
                  {job.description.slice(0, 280)}
                </p>
              )}
            </div>

            {/* Quick generate PDF row */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-[12px] border-brand-200 text-brand-700 hover:bg-brand-50"
                onClick={handleCoverLetterPdf}
                disabled={cvLoading || resumeLoading}
              >
                {cvLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileText className="h-3 w-3" />}
                Cover Letter PDF
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="flex-1 gap-1.5 text-[12px] border-brand-200 text-brand-700 hover:bg-brand-50"
                onClick={handleResumePdf}
                disabled={cvLoading || resumeLoading}
              >
                {resumeLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <FileDown className="h-3 w-3" />}
                Resume PDF
              </Button>
            </div>

            {/* Actions */}
            <div className="space-y-2">
              {job.applyUrl ? (
                <Button
                  className="w-full gap-2 bg-brand-600 hover:bg-brand-700 text-white"
                  onClick={handleOpenAndApply}
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open & Apply
                </Button>
              ) : (
                <p className="text-[12px] text-stone/70 text-center">No apply URL — mark as applied manually.</p>
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
                  className="flex-1 gap-1.5 text-stone"
                  onClick={handleSkip}
                >
                  <SkipForward className="h-3.5 w-3.5" /> Skip
                </Button>
              </div>
            </div>

            {jobs.length - index - 1 > 0 && (
              <p className="text-[11px] text-center text-stone/70">
                {jobs.length - index - 1} more job{jobs.length - index - 1 !== 1 ? 's' : ''} in queue
              </p>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
