"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { CopilotJob, ResumeDocument, JobStatus, STATUS_LABELS, STATUS_COLORS, STATUS_TEXT, getMatchTier, MATCH_TIER_COLORS, RejectionReason, REJECTION_REASON_LABELS, ChecklistItem, DEFAULT_INTERVIEW_CHECKLIST } from "@/types/copilot-job"
import { copilotStore } from "@/lib/copilot-store"
import { buildResumeTex, buildCoverLetterTex, downloadText, downloadBlob, safeFilename } from "@/lib/doc-export"
import { renderResumePdf, renderCoverLetterPdf } from "@/lib/doc-export-pdf"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Skeleton } from "@/components/ui/skeleton"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { toast } from "sonner"
import {
  FileText, Mail, Users, BarChart2, Building2, Send, DollarSign,
  Zap, ExternalLink, Trash2, ChevronDown, ChevronUp, Copy, Check,
  Sparkles, Info, AlertCircle, RefreshCw, MapPin, Banknote, Globe,
  Pencil, X, Star, Calendar, ClipboardCheck, Download, FileCode2, Loader2,
} from "lucide-react"

interface JobCopilotPanelProps {
  job: CopilotJob
  masterResume: File | null
  masterResumeText: string | null
  onUpdate: (updates: Partial<CopilotJob>) => void
  onRemove: () => void
  onUploadResume?: () => void
  /** When set, renders a link to the full job detail page in the panel header. */
  detailHref?: string
}

// ── Shared helpers ────────────────────────────────────────────────────────────

function SkeletonContent({ lines = 5 }: { lines?: number }) {
  return (
    <div className="space-y-2.5 mt-4">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} className={cn("h-3.5 rounded", i === lines - 1 ? "w-2/3" : "w-full")} />
      ))}
    </div>
  )
}

function NoResumeBanner({ onUpload }: { onUpload?: () => void }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-amber-200 bg-amber-50 text-[13px] text-amber-700">
      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
      <div className="flex-1">
        <p className="font-medium leading-snug">Resume needed to generate AI content</p>
        <p className="text-amber-600 mt-0.5 leading-relaxed">
          Your resume text is stored locally and used across all copilot features.
        </p>
        {onUpload && (
          <button
            onClick={onUpload}
            className="mt-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-amber-600 hover:bg-amber-700 text-white text-[12px] font-semibold transition-colors"
          >
            Upload Resume PDF
          </button>
        )}
      </div>
    </div>
  )
}

function ComingSoonBanner({ feature }: { feature: string }) {
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg bg-paper-2 border border-line text-sm text-stone">
      <Info className="h-4 w-4 mt-0.5 shrink-0 text-stone/70" />
      <span>
        <span className="font-medium text-ink-soft">{feature}</span> — requires external knowledge base data (Phase 2).
      </span>
    </div>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  return (
    <Button
      variant="ghost"
      size="sm"
      className="gap-2"
      onClick={async () => {
        await navigator.clipboard.writeText(text)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
      }}
    >
      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      {copied ? 'Copied!' : 'Copy'}
    </Button>
  )
}

// ── Export Menu ───────────────────────────────────────────────────────────────

type ExportVariant = 'resume' | 'coverLetter'

function ExportMenu({
  variant,
  getResumeDoc,
  getCoverLetterBody,
  filename,
}: {
  variant: ExportVariant
  /** For resume: returns the structured doc (may trigger generate first) */
  getResumeDoc?: () => Promise<ResumeDocument | null>
  /** For cover letter: returns the plain letter string */
  getCoverLetterBody?: () => string
  /** Base filename without extension (e.g. "Mourad-Acme") */
  filename: string
}) {
  const [pdfLoading, setPdfLoading] = useState(false)
  const [texLoading, setTexLoading] = useState(false)

  const handlePdf = async () => {
    setPdfLoading(true)
    try {
      if (variant === 'resume') {
        const doc = await getResumeDoc?.()
        if (!doc) { toast.error('Build the résumé document first.'); return }
        const blob = await renderResumePdf(doc)
        downloadBlob(blob, `${filename}.pdf`)
      } else {
        const body = getCoverLetterBody?.() ?? ''
        if (!body) { toast.error('Generate the cover letter first.'); return }
        const blob = await renderCoverLetterPdf(body)
        downloadBlob(blob, `${filename}.pdf`)
      }
    } catch (err) {
      console.error(err)
      toast.error('PDF generation failed. Try again.')
    } finally {
      setPdfLoading(false)
    }
  }

  const handleTex = async () => {
    setTexLoading(true)
    try {
      if (variant === 'resume') {
        const doc = await getResumeDoc?.()
        if (!doc) { toast.error('Build the résumé document first.'); return }
        downloadText(buildResumeTex(doc), `${filename}.tex`, 'application/x-tex')
      } else {
        const body = getCoverLetterBody?.() ?? ''
        if (!body) { toast.error('Generate the cover letter first.'); return }
        downloadText(buildCoverLetterTex(body), `${filename}.tex`, 'application/x-tex')
      }
    } catch (err) {
      console.error(err)
      toast.error('.tex export failed.')
    } finally {
      setTexLoading(false)
    }
  }

  return (
    <div className="flex gap-1.5">
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 h-8 text-[12px] border-brand-200 text-brand-700 hover:bg-brand-50"
        onClick={handlePdf}
        disabled={pdfLoading || texLoading}
      >
        {pdfLoading
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <Download className="h-3 w-3" />
        }
        PDF
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="gap-1.5 h-8 text-[12px] border-line text-stone hover:bg-paper-2"
        onClick={handleTex}
        disabled={pdfLoading || texLoading}
        title="Download Overleaf-ready LaTeX source"
      >
        {texLoading
          ? <Loader2 className="h-3 w-3 animate-spin" />
          : <FileCode2 className="h-3 w-3" />
        }
        .tex
      </Button>
    </div>
  )
}

// ── Generate hook ─────────────────────────────────────────────────────────────

type GenState = 'idle' | 'loading' | 'error'

function useGenerate(endpoint: string, job: CopilotJob, masterResumeText: string | null) {
  const [state, setState] = useState<GenState>('idle')
  const [error, setError] = useState<string | null>(null)

  const generate = async (): Promise<Record<string, unknown> | null> => {
    if (!masterResumeText) return null
    setState('loading')
    setError(null)
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: masterResumeText,
          job_description: job.description,
          job_title: job.title,
          company: job.company,
          relevance_score: job.matchScore !== undefined ? job.matchScore / 100 : null,
        }),
      })
      if (!res.ok) {
        const text = await res.text()
        throw new Error(text)
      }
      const data = await res.json()
      setState('idle')
      return data
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Unknown error'
      setError(msg.slice(0, 200))
      setState('error')
      return null
    }
  }

  return { state, error, generate }
}

// ── "Did you apply?" dialog ──────────────────────────────────────────────────
function DidYouApplyDialog({
  open,
  onYes,
  onNo,
}: {
  open: boolean
  onYes: () => void
  onNo: () => void
}) {
  return (
    <Dialog open={open} onOpenChange={o => { if (!o) onNo() }}>
      <DialogContent className="max-w-xs">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Did you apply?</DialogTitle>
        </DialogHeader>
        <p className="text-[13px] text-stone">Mark this job as applied to keep your tracker up to date.</p>
        <div className="flex gap-2 pt-1">
          <Button
            className="flex-1 bg-brand-600 hover:bg-brand-700 text-white"
            onClick={onYes}
          >
            Yes, I applied!
          </Button>
          <Button variant="ghost" className="flex-1 text-stone" onClick={onNo}>
            Not yet
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

// ── Description cleaner + renderer ───────────────────────────────────────────

function cleanDescription(raw: string): string {
  return raw
    // Structural HTML → whitespace
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>|<\/div>|<\/section>|<\/article>/gi, '\n\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<li[^>]*>/gi, '• ')
    .replace(/<\/ul>|<\/ol>/gi, '\n')
    .replace(/<\/h[1-6]>/gi, '\n')
    .replace(/<h[1-6][^>]*>/gi, '\n__H__')   // sentinel for headers
    .replace(/<\/?(strong|b)>/gi, '')
    .replace(/<\/?(em|i)>/gi, '')
    // Strip remaining tags
    .replace(/<[^>]+>/g, '')
    // Decode HTML entities
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&#8226;|&#x2022;|•/g, '•')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    // Normalise
    .replace(/\r\n?/g, '\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

type Block =
  | { type: 'header'; text: string }
  | { type: 'bullets'; items: string[] }
  | { type: 'para'; text: string }
  | { type: 'gap' }

function parseBlocks(text: string): Block[] {
  const lines = text.split('\n')
  const result: Block[] = []
  let bullets: string[] = []

  const SECTION_RE = /^(Requirements?|Qualifications?|Responsibilities?|About (the (role|job|company|position)|us)|What you|We (offer|are looking|need|require)|Skills?|Experience|Education|Location|Salary|Job Type|Benefits?|Perks?|Overview|Summary|Duties|Key tasks?|Compensation|The team|Your role|Role overview|Nice to have|Must have|Preferred|Minimum)[\s:]?$/i

  const flushBullets = () => {
    if (bullets.length) { result.push({ type: 'bullets', items: [...bullets] }); bullets = [] }
  }

  for (const raw of lines) {
    const line = raw.trim()

    if (!line) {
      flushBullets()
      if (result.length && result[result.length - 1].type !== 'gap') result.push({ type: 'gap' })
      continue
    }

    // HTML-marked header
    if (line.startsWith('__H__')) {
      flushBullets()
      const h = line.slice(5).trim()
      if (h) result.push({ type: 'header', text: h })
      continue
    }

    // Bullet (• - * or 1. 2.)
    if (/^[•\-\*]\s+\S/.test(line)) { bullets.push(line.replace(/^[•\-\*]\s+/, '')); continue }
    if (/^\d+[.)]\s+\S/.test(line)) { bullets.push(line.replace(/^\d+[.)]\s+/, '')); continue }

    flushBullets()

    // Detect section header
    const isAllCaps = line === line.toUpperCase() && /[A-Z]{2,}/.test(line) && line.length > 2 && line.length < 80
    const isColonHeader = line.endsWith(':') && line.length < 70 && !/[.!?,]/.test(line.slice(0, -1))
    const isKnownSection = SECTION_RE.test(line.replace(/:$/, ''))

    if (isAllCaps || isColonHeader || isKnownSection) {
      result.push({ type: 'header', text: line.replace(/:$/, '') })
    } else {
      result.push({ type: 'para', text: line })
    }
  }

  flushBullets()
  // Remove trailing gap
  while (result.length && result[result.length - 1].type === 'gap') result.pop()
  return result
}

function JobDescriptionRenderer({ text }: { text: string }) {
  const blocks = useMemo(() => parseBlocks(text), [text])

  return (
    <div className="space-y-0">
      {blocks.map((block, i) => {
        if (block.type === 'gap') return <div key={i} className="h-3" />

        if (block.type === 'header') return (
          <h4 key={i} className={cn(
            "text-[11px] font-bold text-stone uppercase tracking-wider pb-1 border-b border-line",
            i === 0 ? "mt-0 mb-2" : "mt-4 mb-2",
          )}>
            {block.text}
          </h4>
        )

        if (block.type === 'bullets') return (
          <ul key={i} className="space-y-1.5 mb-1">
            {block.items.map((item, j) => (
              <li key={j} className="flex items-start gap-2 text-[13px] text-stone leading-relaxed">
                <span className="text-brand-300 shrink-0 mt-[3px] text-[9px] font-bold">▸</span>
                <span>{item}</span>
              </li>
            ))}
          </ul>
        )

        return (
          <p key={i} className="text-[13px] text-stone leading-relaxed">
            {block.text}
          </p>
        )
      })}
    </div>
  )
}

// ── TAB: OVERVIEW ─────────────────────────────────────────────────────────────
function OverviewTab({ job, onUpdate }: { job: CopilotJob; onUpdate: (u: Partial<CopilotJob>) => void }) {
  const [expanded, setExpanded] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [showApplyDialog, setShowApplyDialog] = useState(false)
  const [editForm, setEditForm] = useState({
    title: job.title,
    company: job.company,
    location: job.location,
    salary: job.salary,
    applyUrl: job.applyUrl,
  })

  // Reset edit form when the selected job changes
  useEffect(() => {
    setEditForm({ title: job.title, company: job.company, location: job.location, salary: job.salary, applyUrl: job.applyUrl })
    setIsEditing(false)
    setExpanded(false)
    setShowApplyDialog(false)
  }, [job.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const saveEdits = () => {
    onUpdate(editForm)
    setIsEditing(false)
  }

  const handleApplyNow = async () => {
    // Auto-copy cover letter to clipboard so user can paste directly on the job site
    const docToCopy = job.aiContent?.coverLetter || job.aiContent?.tailoredResume
    if (docToCopy) {
      try {
        await navigator.clipboard.writeText(docToCopy)
        toast.success('Cover letter copied to clipboard', {
          description: 'Open the job site and paste it straight into the form.',
          duration: 5000,
        })
      } catch {
        // Clipboard permission denied — silently skip
      }
    }
    window.open(job.applyUrl, '_blank')
    setShowApplyDialog(true)
  }

  const handleApplyYes = () => {
    onUpdate({ status: 'applied', appliedAt: new Date().toISOString() })
    setShowApplyDialog(false)
  }

  const cleanDesc = useMemo(() => cleanDescription(job.description || ''), [job.description])
  const TRUNCATE_LEN = 1800
  const needsTruncate = cleanDesc.length > TRUNCATE_LEN
  const displayDesc = expanded || !needsTruncate ? cleanDesc : cleanDesc.slice(0, TRUNCATE_LEN)

  const isRemote   = /remote/i.test(job.location)
  const hasSalary  = job.salary && !['not specified', 'competitive', ''].includes(job.salary.toLowerCase())
  const sourceLabel = job.source === 'ai_search' ? 'AI Search' : job.source === 'url' ? 'URL Import' : 'Manual'

  // Follow-up overdue / due today
  const followUpDue = job.followUpAt
    ? new Date(job.followUpAt) <= new Date()
    : false

  return (
    <div className="space-y-5 max-w-3xl">

      {/* "Did you apply?" dialog */}
      <DidYouApplyDialog
        open={showApplyDialog}
        onYes={handleApplyYes}
        onNo={() => setShowApplyDialog(false)}
      />

      {/* Info chips: location, remote, salary, source — with Edit toggle */}
      <div className="flex flex-wrap items-start gap-2">
        <div className="flex flex-wrap gap-2 flex-1 min-w-0">
          {job.location && job.location !== 'Not specified' && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-paper-2 border border-line text-[12px] text-stone font-medium">
              <MapPin className="h-3 w-3 text-stone/70 shrink-0" />
              {job.location}
            </span>
          )}
          {isRemote && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-brand-50 border border-brand-200 text-[12px] text-brand-600 font-medium">
              <Globe className="h-3 w-3 shrink-0" />
              Remote
            </span>
          )}
          {hasSalary && (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-50 border border-emerald-200 text-[12px] text-emerald-700 font-medium">
              <Banknote className="h-3 w-3 shrink-0" />
              {job.salary}
            </span>
          )}
          <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-paper-2 border border-line text-[12px] text-stone/70">
            via {sourceLabel}
          </span>
          {job.appliedAt && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-blue-50 border border-blue-200 text-[12px] text-blue-600 font-medium">
              ✓ Applied {new Date(job.appliedAt).toLocaleDateString()}
            </span>
          )}
        </div>
        <button
          onClick={() => setIsEditing(e => !e)}
          className="inline-flex items-center gap-1 text-[11px] font-medium text-stone/70 hover:text-stone transition-colors shrink-0 mt-0.5"
          aria-label={isEditing ? 'Cancel editing' : 'Edit job details'}
        >
          {isEditing ? <X className="h-3 w-3" /> : <Pencil className="h-3 w-3" />}
          {isEditing ? 'Cancel' : 'Edit'}
        </button>
      </div>

      {/* Inline edit form */}
      {isEditing && (
        <div className="rounded-lg border border-brand-100 bg-brand-50/40 p-4 space-y-3">
          <p className="text-[11px] font-semibold text-brand-600 uppercase tracking-wider">Edit details</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stone">Job Title</label>
              <Input
                value={editForm.title}
                onChange={e => setEditForm(f => ({ ...f, title: e.target.value }))}
                className="h-8 text-[13px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stone">Company</label>
              <Input
                value={editForm.company}
                onChange={e => setEditForm(f => ({ ...f, company: e.target.value }))}
                className="h-8 text-[13px]"
              />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stone">Location</label>
              <Input
                value={editForm.location}
                onChange={e => setEditForm(f => ({ ...f, location: e.target.value }))}
                className="h-8 text-[13px]"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[11px] font-medium text-stone">Salary</label>
              <Input
                value={editForm.salary}
                onChange={e => setEditForm(f => ({ ...f, salary: e.target.value }))}
                className="h-8 text-[13px]"
                placeholder="e.g. €80K – €110K"
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[11px] font-medium text-stone">Apply URL</label>
            <Input
              value={editForm.applyUrl}
              onChange={e => setEditForm(f => ({ ...f, applyUrl: e.target.value }))}
              className="h-8 text-[13px]"
              placeholder="https://…"
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="ghost" size="sm" className="h-7 text-[12px]" onClick={() => setIsEditing(false)}>
              Cancel
            </Button>
            <Button size="sm" className="h-7 text-[12px] bg-brand-600 hover:bg-brand-700 text-white" onClick={saveEdits}>
              Save changes
            </Button>
          </div>
        </div>
      )}

      {/* Status + Apply */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-stone/70 uppercase tracking-wider">Status</span>
          <Select value={job.status} onValueChange={v => {
            const status = v as JobStatus
            const extra: Partial<CopilotJob> = {}
            if (status === 'applied' && !job.appliedAt) extra.appliedAt = new Date().toISOString()
            if (status === 'interview' && (!job.interviewChecklist || job.interviewChecklist.length === 0)) {
              extra.interviewChecklist = DEFAULT_INTERVIEW_CHECKLIST.map((text, i) => ({
                id: `cl-${Date.now()}-${i}`, text, done: false,
              }))
            }
            onUpdate({ status, ...extra })
          }}>
            <SelectTrigger className="h-8 text-[13px] w-36">
              <div className="flex items-center gap-2">
                <span className={cn("h-1.5 w-1.5 rounded-full shrink-0", STATUS_COLORS[job.status])} />
                <SelectValue />
              </div>
            </SelectTrigger>
            <SelectContent>
              {(Object.entries(STATUS_LABELS) as [JobStatus, string][]).map(([k, v]) => (
                <SelectItem key={k} value={k}>
                  <div className="flex items-center gap-2">
                    <span className={cn("h-1.5 w-1.5 rounded-full", STATUS_COLORS[k])} />
                    {v}
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {job.applyUrl && (
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5 h-8 text-[13px]"
            onClick={handleApplyNow}
          >
            <ExternalLink className="h-3.5 w-3.5" /> Apply now
          </Button>
        )}
      </div>

      {/* Dates row: follow-up + deadline */}
      <div className="flex flex-wrap gap-x-6 gap-y-2">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className={cn("h-3.5 w-3.5 shrink-0", followUpDue ? "text-amber-500" : "text-stone/70")} />
            <span className={cn("text-[11px] font-semibold uppercase tracking-wider", followUpDue ? "text-amber-600" : "text-stone/70")}>
              Follow-up{followUpDue ? ' — due!' : ''}
            </span>
          </div>
          <Input
            type="date"
            value={job.followUpAt ?? ''}
            onChange={e => onUpdate({ followUpAt: e.target.value || undefined })}
            className={cn("h-7 text-[12px] w-36", followUpDue && "border-amber-300 bg-amber-50 text-amber-700")}
            aria-label="Follow-up reminder date"
          />
          {job.followUpAt && (
            <button onClick={() => onUpdate({ followUpAt: undefined })} className="text-stone/70 hover:text-stone" aria-label="Clear follow-up">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Calendar className={cn("h-3.5 w-3.5 shrink-0", job.deadline && job.deadline < new Date().toISOString().slice(0,10) ? "text-red-400" : "text-stone/70")} />
            <span className={cn("text-[11px] font-semibold uppercase tracking-wider", job.deadline && job.deadline < new Date().toISOString().slice(0,10) ? "text-red-500" : "text-stone/70")}>
              Deadline{job.deadline && job.deadline < new Date().toISOString().slice(0,10) ? ' — passed!' : ''}
            </span>
          </div>
          <Input
            type="date"
            value={job.deadline ?? ''}
            onChange={e => onUpdate({ deadline: e.target.value || undefined })}
            className={cn("h-7 text-[12px] w-36", job.deadline && job.deadline < new Date().toISOString().slice(0,10) && "border-red-200 bg-red-50 text-red-600")}
            aria-label="Application deadline"
          />
          {job.deadline && (
            <button onClick={() => onUpdate({ deadline: undefined })} className="text-stone/70 hover:text-stone" aria-label="Clear deadline">
              <X className="h-3 w-3" />
            </button>
          )}
        </div>
      </div>

      {/* Company quick-links */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-[11px] font-semibold text-stone/70 uppercase tracking-wider">Research</span>
        {[
          { label: 'Glassdoor', href: `https://www.glassdoor.com/Search/results.htm?keyword=${encodeURIComponent(job.company)}` },
          { label: 'LinkedIn', href: `https://www.linkedin.com/company/${encodeURIComponent(job.company.toLowerCase().replace(/\s+/g,'-'))}` },
          { label: 'Crunchbase', href: `https://www.crunchbase.com/textsearch?q=${encodeURIComponent(job.company)}` },
        ].map(({ label, href }) => (
          <a key={label} href={href} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md border border-line bg-paper-2 hover:bg-card hover:border-line-strong text-[11px] font-medium text-stone transition-colors">
            <ExternalLink className="h-2.5 w-2.5" /> {label}
          </a>
        ))}
      </div>

      {/* Rejection reason — visible when status is rejected or ghosted */}
      {(job.status === 'rejected' || job.status === 'ghosted') && (
        <div className="rounded-lg border border-red-100 bg-red-50/40 p-3 space-y-2">
          <p className="text-[11px] font-semibold text-red-500 uppercase tracking-wider">Rejection reason</p>
          <div className="flex flex-wrap gap-1.5">
            {(Object.entries(REJECTION_REASON_LABELS) as [RejectionReason, string][]).map(([k, v]) => (
              <button key={k} onClick={() => onUpdate({ rejectionReason: job.rejectionReason === k ? undefined : k })}
                className={cn(
                  "px-2.5 py-1 rounded-md border text-[11px] font-medium transition-colors",
                  job.rejectionReason === k
                    ? "border-red-400 bg-red-100 text-red-700"
                    : "border-line bg-card text-stone hover:border-line-strong",
                )}>
                {v}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Interview checklist — visible when status is interview */}
      {job.status === 'interview' && (
        <div className="rounded-lg border border-amber-200 bg-amber-50/30 p-4 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider">Interview prep checklist</p>
            <span className="text-[11px] text-amber-500 tabular-nums">
              {(job.interviewChecklist ?? []).filter(i => i.done).length}/{(job.interviewChecklist ?? []).length}
            </span>
          </div>
          {(!job.interviewChecklist || job.interviewChecklist.length === 0) && (
            <button
              onClick={() => onUpdate({ interviewChecklist: DEFAULT_INTERVIEW_CHECKLIST.map((text, i) => ({ id: `cl-${Date.now()}-${i}`, text, done: false })) })}
              className="text-[12px] text-amber-600 underline"
            >
              Generate prep checklist
            </button>
          )}
          <div className="space-y-1.5">
            {(job.interviewChecklist ?? []).map((item: ChecklistItem) => (
              <button key={item.id}
                onClick={() => {
                  const updated = (job.interviewChecklist ?? []).map((c: ChecklistItem) =>
                    c.id === item.id ? { ...c, done: !c.done } : c
                  )
                  onUpdate({ interviewChecklist: updated })
                }}
                className="w-full flex items-center gap-2.5 p-2 rounded-md hover:bg-amber-50 transition-colors text-left"
              >
                <div className={cn("h-4 w-4 rounded border-2 flex items-center justify-center shrink-0 transition-colors",
                  item.done ? "bg-amber-500 border-amber-500" : "border-line-strong bg-card")}>
                  {item.done && <Check className="h-2.5 w-2.5 text-white" />}
                </div>
                <span className={cn("text-[12px] leading-snug", item.done ? "line-through text-stone/70" : "text-ink-soft")}>
                  {item.text}
                </span>
              </button>
            ))}
          </div>
          {(job.interviewChecklist ?? []).filter((i: ChecklistItem) => i.done).length === (job.interviewChecklist ?? []).length && (job.interviewChecklist ?? []).length > 0 && (
            <p className="text-[11px] text-amber-600 font-medium text-center pt-1">All done — good luck! 🎯</p>
          )}
        </div>
      )}

      {/* Job description */}
      {job.description ? (
        <div>
          <h3 className="text-[11px] font-semibold text-stone/70 uppercase tracking-wider mb-3">Description</h3>
          <div className="rounded-lg bg-paper-2/60 border border-line p-4 max-h-[520px] overflow-y-auto">
            <JobDescriptionRenderer text={displayDesc} />
            {needsTruncate && !expanded && (
              <div className="mt-3 pt-3 border-t border-line">
                <button
                  className="text-[12px] text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
                  onClick={() => setExpanded(true)}
                >
                  <ChevronDown className="h-3 w-3" /> Show full description
                </button>
              </div>
            )}
          </div>
          {needsTruncate && expanded && (
            <button
              className="mt-2 text-[12px] text-brand-600 hover:text-brand-700 flex items-center gap-1 font-medium"
              onClick={() => setExpanded(false)}
            >
              <ChevronUp className="h-3 w-3" /> Show less
            </button>
          )}
        </div>
      ) : (
        <p className="text-[13px] text-stone/70 italic">No description available.</p>
      )}

      {/* Apply Kit — quick-copy companion */}
      {(job.aiContent?.coverLetter || job.aiContent?.tailoredResume) && (
        <div className="rounded-md border border-brand-100 bg-brand-50/40 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <ClipboardCheck className="h-4 w-4 text-brand-500 shrink-0" />
            <h3 className="text-[12px] font-bold text-brand-800 uppercase tracking-wide">Apply Kit</h3>
            <span className="text-[10px] text-brand-400 ml-auto">click any button to copy to clipboard</span>
          </div>
          <p className="text-[11px] text-brand-600/70 leading-relaxed -mt-1">
            Hitting Apply Now auto-copies your cover letter. Use these buttons to re-copy any doc while filling the form.
          </p>
          <div className="space-y-2">
            {job.aiContent?.coverLetter && (
              <ApplyKitRow
                label="Cover Letter"
                preview={job.aiContent.coverLetter.slice(0, 120) + '…'}
                content={job.aiContent.coverLetter}
              />
            )}
            {job.aiContent?.tailoredResume && (
              <ApplyKitRow
                label="Resume Bullets"
                preview="Tailored resume suggestions for this role"
                content={typeof job.aiContent.tailoredResume === 'string'
                  ? job.aiContent.tailoredResume
                  : JSON.stringify(job.aiContent.tailoredResume, null, 2)}
              />
            )}
            {job.aiContent?.interviewQuestions && job.aiContent.interviewQuestions.length > 0 && (
              <ApplyKitRow
                label="Interview Prep"
                preview={`${job.aiContent.interviewQuestions.length} practice questions`}
                content={job.aiContent.interviewQuestions.join('\n\n')}
              />
            )}
          </div>
        </div>
      )}

      {/* Connections + Contact row */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <h3 className="text-[11px] font-semibold text-stone/70 uppercase tracking-wider mb-2">Connections</h3>
          <Input
            placeholder="Anyone you know there?"
            className="text-[12px] h-8"
            value={job.connections ?? ""}
            onChange={e => onUpdate({ connections: e.target.value || undefined })}
          />
          <p className="text-[10px] text-stone/70 mt-1">Name, LinkedIn, or email of an insider</p>
        </div>
        <div>
          <h3 className="text-[11px] font-semibold text-stone/70 uppercase tracking-wider mb-2">Contact</h3>
          <Input
            placeholder="Recruiter or hiring manager"
            className="text-[12px] h-8"
            value={job.contact ?? ""}
            onChange={e => onUpdate({ contact: e.target.value || undefined })}
          />
          <p className="text-[10px] text-stone/70 mt-1">Name and email/LinkedIn of point of contact</p>
        </div>
      </div>

      {/* Notes */}
      <div>
        <h3 className="text-[11px] font-semibold text-stone/70 uppercase tracking-wider mb-2">Notes</h3>
        <Textarea
          placeholder="Interview date, referral details, anything relevant…"
          className="text-[13px] resize-none min-h-[100px] leading-relaxed"
          value={job.notes}
          onChange={e => onUpdate({ notes: e.target.value })}
        />
      </div>
    </div>
  )
}

function ApplyKitRow({ label, preview, content }: { label: string; preview: string; content: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setCopied(true)
      toast.success(`${label} copied!`, { duration: 2000 })
      setTimeout(() => setCopied(false), 2000)
    } catch {
      toast.error('Clipboard access denied')
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 bg-card rounded-lg border border-brand-100 px-3 py-2.5">
      <div className="min-w-0 flex-1">
        <p className="text-[12px] font-semibold text-ink">{label}</p>
        <p className="text-[11px] text-stone/70 truncate mt-0.5">{preview}</p>
      </div>
      <button
        onClick={handleCopy}
        className={cn(
          "shrink-0 flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded-lg transition-all",
          copied
            ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
            : "bg-brand-600 hover:bg-brand-700 text-white border border-brand-700",
        )}
      >
        {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
        {copied ? 'Copied' : 'Copy'}
      </button>
    </div>
  )
}

// ── TAB: RESUME ───────────────────────────────────────────────────────────────
function ResumeTab({ job, masterResume, masterResumeText, onAiContent, onUploadResume }: {
  job: CopilotJob
  masterResume: File | null
  masterResumeText: string | null
  onAiContent: (c: Partial<CopilotJob['aiContent']>) => void
  onUploadResume?: () => void
}) {
  const { state, error, generate } = useGenerate('/api/generate/tailored-resume/', job, masterResumeText)
  const [docState, setDocState] = useState<'idle' | 'loading' | 'error'>('idle')
  const [docError, setDocError] = useState<string | null>(null)

  const suggestions: Array<{ original: string; reason: string; rewritten: string }> =
    Array.isArray(job.aiContent.tailoredResume)
      ? (job.aiContent.tailoredResume as unknown as typeof suggestions)
      : []

  const resumeDoc = job.aiContent.resumeDocument ?? null

  const handleGenerate = async () => {
    const data = await generate()
    if (data?.suggestions) {
      onAiContent({ tailoredResume: data.suggestions as unknown as string })
    }
  }

  /** Build the full structured résumé document (separate from suggestions). */
  const handleBuildDoc = async () => {
    if (!masterResumeText) { toast.error('Upload your résumé PDF first.'); return }
    setDocState('loading')
    setDocError(null)
    try {
      const res = await fetch('/api/generate/resume-document/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resume_text: masterResumeText,
          job_description: job.description,
          job_title: job.title,
          company: job.company,
          relevance_score: job.matchScore !== undefined ? job.matchScore / 100 : null,
        }),
      })
      const data = await res.json()
      if (!res.ok || !data.resume) throw new Error(data.error ?? 'Failed to build résumé document.')
      onAiContent({ resumeDocument: data.resume as ResumeDocument })
      toast.success('Tailored résumé built — ready to export.')
      setDocState('idle')
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Unknown error'
      setDocError(msg)
      setDocState('error')
    }
  }

  /** Used by ExportMenu — triggers build if doc not yet present. */
  const getResumeDoc = async (): Promise<ResumeDocument | null> => {
    if (resumeDoc) return resumeDoc
    await handleBuildDoc()
    return job.aiContent.resumeDocument ?? null
  }

  const exportFilename = safeFilename("resume", job.company, job.title)

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h3 className="font-semibold text-sm">Tailored Resume</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Concrete suggestions to optimise your resume for this specific role — no invented skills, only rephrasing what&apos;s there.
        </p>
      </div>

      {!masterResumeText && <NoResumeBanner onUpload={onUploadResume} />}
      {error && <p className="text-xs text-red-500 p-3 border border-red-200 rounded-lg bg-red-50">{error}</p>}
      {docError && <p className="text-xs text-red-500 p-3 border border-red-200 rounded-lg bg-red-50">{docError}</p>}

      {/* Suggestions section */}
      {suggestions.length > 0 ? (
        <div className="space-y-3">
          {suggestions.map((s, i) => (
            <div key={i} className="border rounded-lg p-4 space-y-2">
              <div>
                <p className="text-xs font-semibold text-stone/70 uppercase mb-1">Original</p>
                <p className="text-sm text-muted-foreground italic">&ldquo;{s.original}&rdquo;</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-amber-600 uppercase mb-1">Why change it</p>
                <p className="text-sm text-muted-foreground">{s.reason}</p>
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-600 uppercase mb-1">Rewritten</p>
                <p className="text-sm font-medium">&ldquo;{s.rewritten}&rdquo;</p>
              </div>
            </div>
          ))}
          <Button size="sm" variant="outline" className="gap-2" onClick={handleGenerate} disabled={state === 'loading' || !masterResumeText}>
            <RefreshCw className={cn("h-3.5 w-3.5", state === 'loading' && "animate-spin")} />
            {state === 'loading' ? 'Regenerating…' : 'Regenerate'}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          disabled={state === 'loading' || !masterResumeText}
          onClick={handleGenerate}
        >
          <Sparkles className={cn("h-3.5 w-3.5", state === 'loading' && "animate-pulse")} />
          {state === 'loading' ? 'Generating…' : 'Generate Tailored Resume'}
        </Button>
      )}

      {/* ── Export section ── */}
      <div className="border-t pt-4 space-y-3">
        <div>
          <p className="text-[12px] font-semibold text-ink-soft">Export as PDF / LaTeX</p>
          <p className="text-[11px] text-muted-foreground mt-0.5">
            Builds a complete tailored résumé document from your resume + this job, then downloads as a polished PDF or Overleaf-ready .tex file.
          </p>
        </div>
        {resumeDoc ? (
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
              <Check className="h-3 w-3" /> Résumé built
            </span>
            <ExportMenu
              variant="resume"
              getResumeDoc={getResumeDoc}
              filename={exportFilename}
            />
            <Button
              size="sm"
              variant="ghost"
              className="h-7 text-[11px] text-stone/70 hover:text-ink-soft gap-1"
              onClick={handleBuildDoc}
              disabled={docState === 'loading' || !masterResumeText}
            >
              <RefreshCw className={cn("h-3 w-3", docState === 'loading' && "animate-spin")} />
              Rebuild
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="gap-2 bg-brand-600 hover:bg-brand-700 text-white"
            onClick={handleBuildDoc}
            disabled={docState === 'loading' || !masterResumeText}
          >
            {docState === 'loading'
              ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
              : <FileText className="h-3.5 w-3.5" />
            }
            {docState === 'loading' ? 'Building résumé…' : 'Build Tailored Résumé'}
          </Button>
        )}
      </div>
    </div>
  )
}

// ── TAB: COVER LETTER ─────────────────────────────────────────────────────────
function CoverLetterTab({ job, masterResumeText, onAiContent, onUploadResume }: {
  job: CopilotJob
  masterResumeText: string | null
  onAiContent: (c: Partial<CopilotJob['aiContent']>) => void
  onUploadResume?: () => void
}) {
  const { state, error, generate } = useGenerate('/api/generate/cover-letter/', job, masterResumeText)
  const letter = job.aiContent.coverLetter ?? ''

  const handleGenerate = async () => {
    const data = await generate()
    if (data?.cover_letter) onAiContent({ coverLetter: data.cover_letter as string })
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h3 className="font-semibold text-sm">Cover Letter</h3>
        <p className="text-sm text-muted-foreground mt-1">
          A personalised draft built from your resume and this job's description — not a generic template.
        </p>
      </div>

      {!masterResumeText && <NoResumeBanner onUpload={onUploadResume} />}
      {error && <p className="text-xs text-red-500 p-3 border border-red-200 rounded-lg bg-red-50">{error}</p>}

      {letter ? (
        <div className="space-y-3">
          <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap bg-paper-2 border rounded-lg p-5 font-sans">
            {letter}
          </pre>
          <div className="flex flex-wrap gap-2 items-center">
            <CopyButton text={letter} />
            <Button size="sm" variant="outline" className="gap-2" onClick={handleGenerate} disabled={state === 'loading' || !masterResumeText}>
              <RefreshCw className={cn("h-3.5 w-3.5", state === 'loading' && "animate-spin")} />
              {state === 'loading' ? 'Regenerating…' : 'Regenerate'}
            </Button>
            <div className="h-4 w-px bg-line hidden sm:block" />
            <ExportMenu
              variant="coverLetter"
              getCoverLetterBody={() => letter}
              filename={safeFilename("cover-letter", job.company, job.title)}
            />
          </div>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          disabled={state === 'loading' || !masterResumeText}
          onClick={handleGenerate}
        >
          <Sparkles className={cn("h-3.5 w-3.5", state === 'loading' && "animate-pulse")} />
          {state === 'loading' ? 'Generating…' : 'Generate Cover Letter'}
        </Button>
      )}
    </div>
  )
}

// ── TAB: INTERVIEW PREP ───────────────────────────────────────────────────────
function InterviewTab({ job, masterResumeText, onAiContent, onUploadResume }: {
  job: CopilotJob
  masterResumeText: string | null
  onAiContent: (c: Partial<CopilotJob['aiContent']>) => void
  onUploadResume?: () => void
}) {
  const { state, error, generate } = useGenerate('/api/generate/interview-prep/', job, masterResumeText)

  type Question = {
    question: string
    type: string
    star: { situation: string; task: string; action: string; result: string }
  }
  const questions: Question[] = (job.aiContent.interviewQuestions as unknown as Question[]) ?? []

  const handleGenerate = async () => {
    const data = await generate()
    if (data?.questions) onAiContent({ interviewQuestions: data.questions as unknown as string[] })
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h3 className="font-semibold text-sm">Interview Prep</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Likely questions for this role with STAR-method talking points from your own background.
        </p>
      </div>

      {!masterResumeText && <NoResumeBanner onUpload={onUploadResume} />}
      {error && <p className="text-xs text-red-500 p-3 border border-red-200 rounded-lg bg-red-50">{error}</p>}

      {questions.length > 0 ? (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <details key={i} className="border rounded-lg group">
              <summary className="flex items-start justify-between gap-3 p-4 cursor-pointer list-none">
                <p className="text-sm font-medium">{q.question}</p>
                <span className="text-xs px-2 py-0.5 rounded-full bg-paper-2 text-stone shrink-0">{q.type}</span>
              </summary>
              {q.star && (
                <div className="px-4 pb-4 space-y-2 border-t pt-3">
                  {(['situation', 'task', 'action', 'result'] as const).map(k => (
                    <div key={k}>
                      <span className="text-xs font-semibold text-stone/70 uppercase">{k}: </span>
                      <span className="text-sm text-muted-foreground">{q.star[k]}</span>
                    </div>
                  ))}
                </div>
              )}
            </details>
          ))}
          <Button size="sm" variant="outline" className="gap-2" onClick={handleGenerate} disabled={state === 'loading' || !masterResumeText}>
            <RefreshCw className={cn("h-3.5 w-3.5", state === 'loading' && "animate-spin")} />
            {state === 'loading' ? 'Regenerating…' : 'Regenerate'}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          disabled={state === 'loading' || !masterResumeText}
          onClick={handleGenerate}
        >
          <Sparkles className={cn("h-3.5 w-3.5", state === 'loading' && "animate-pulse")} />
          {state === 'loading' ? 'Generating…' : 'Generate Interview Prep'}
        </Button>
      )}
    </div>
  )
}

// ── TAB: FIT ANALYSIS ─────────────────────────────────────────────────────────
function FitTab({ job, masterResumeText, onAiContent, onUploadResume }: {
  job: CopilotJob
  masterResumeText: string | null
  onAiContent: (c: Partial<CopilotJob['aiContent']>) => void
  onUploadResume?: () => void
}) {
  const { state, error, generate } = useGenerate('/api/generate/fit-analysis/', job, masterResumeText)

  type FitData = {
    summary: string
    strengths: string[]
    partial_matches: string[]
    gaps: string[]
    recommendation: string
  }
  const fitData: FitData | null = job.aiContent.skillGaps as unknown as FitData ?? null

  const handleGenerate = async () => {
    const data = await generate()
    if (data) onAiContent({ skillGaps: data as unknown as string[] })
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h3 className="font-semibold text-sm">Fit & Gap Analysis</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Strengths, partial overlaps, and key gaps compared to this role's requirements.
        </p>
      </div>

      {job.matchScore !== undefined && (
        <div className="flex items-center gap-4 p-4 border rounded-lg">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">AI Match Score</p>
            <p className="text-3xl font-bold mt-0.5">{job.matchScore}<span className="text-base text-muted-foreground">%</span></p>
          </div>
          <div className="flex-1">
            <div className="w-full bg-paper-2 rounded-full h-2 overflow-hidden">
              <div className="h-full bg-primary rounded-full" style={{ width: `${job.matchScore}%` }} />
            </div>
          </div>
        </div>
      )}

      {!masterResumeText && <NoResumeBanner onUpload={onUploadResume} />}
      {error && <p className="text-xs text-red-500 p-3 border border-red-200 rounded-lg bg-red-50">{error}</p>}

      {fitData ? (
        <div className="space-y-3">
          {fitData.summary && <p className="text-sm text-muted-foreground">{fitData.summary}</p>}

          {fitData.strengths?.length > 0 && (
            <div className="border rounded-lg p-4">
              <p className="text-xs font-semibold text-emerald-600 uppercase mb-2">Strengths</p>
              <ul className="space-y-1">{fitData.strengths.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-emerald-400 shrink-0" />{s}</li>)}</ul>
            </div>
          )}
          {fitData.partial_matches?.length > 0 && (
            <div className="border rounded-lg p-4">
              <p className="text-xs font-semibold text-amber-600 uppercase mb-2">Partial Overlaps</p>
              <ul className="space-y-1">{fitData.partial_matches.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-amber-400 shrink-0" />{s}</li>)}</ul>
            </div>
          )}
          {fitData.gaps?.length > 0 && (
            <div className="border rounded-lg p-4">
              <p className="text-xs font-semibold text-red-600 uppercase mb-2">Key Gaps</p>
              <ul className="space-y-1">{fitData.gaps.map((s, i) => <li key={i} className="text-sm text-muted-foreground flex gap-2"><span className="mt-2 h-1.5 w-1.5 rounded-full bg-red-400 shrink-0" />{s}</li>)}</ul>
            </div>
          )}
          {fitData.recommendation && (
            <div className="p-3 bg-paper-2 border rounded-lg text-sm">
              <span className="font-medium">Recommendation: </span>
              <span className="text-muted-foreground">{fitData.recommendation}</span>
            </div>
          )}
          <Button size="sm" variant="outline" className="gap-2" onClick={handleGenerate} disabled={state === 'loading' || !masterResumeText}>
            <RefreshCw className={cn("h-3.5 w-3.5", state === 'loading' && "animate-spin")} />
            {state === 'loading' ? 'Re-analysing…' : 'Re-analyse'}
          </Button>
        </div>
      ) : (
        <Button
          size="sm"
          variant="outline"
          className="gap-2"
          disabled={state === 'loading' || !masterResumeText}
          onClick={handleGenerate}
        >
          <Sparkles className={cn("h-3.5 w-3.5", state === 'loading' && "animate-pulse")} />
          {state === 'loading' ? 'Analysing…' : 'Analyse Fit'}
        </Button>
      )}
    </div>
  )
}

// ── TAB: COMPANY INTEL ────────────────────────────────────────────────────────
function CompanyTab({ job }: { job: CopilotJob }) {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h3 className="font-semibold text-sm">Company Intel</h3>
        <p className="text-sm text-muted-foreground mt-1">Research on {job.company} — culture, news, interview process.</p>
      </div>
      <ComingSoonBanner feature="Company Research" />
      <div className="space-y-3 opacity-50 pointer-events-none select-none">
        {['Overview & Mission', 'Culture & Values', 'Recent News', 'Interview Process', 'Glassdoor Summary'].map(s => (
          <div key={s} className="border rounded-lg p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{s}</p>
            <SkeletonContent lines={3} />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TAB: OUTREACH ─────────────────────────────────────────────────────────────
function OutreachTab({ job, masterResumeText, onAiContent, onUploadResume }: {
  job: CopilotJob
  masterResumeText: string | null
  onAiContent: (c: Partial<CopilotJob['aiContent']>) => void
  onUploadResume?: () => void
}) {
  const [mode, setMode] = useState<'email' | 'linkedin'>('email')
  const { state, error, generate } = useGenerate('/api/generate/outreach/', job, masterResumeText)

  // Gate: outreach quality depends on having real job description + company
  const hasProperInfo = !!(job.company?.trim() && job.description?.trim().length > 150)

  const emailData = useMemo(() => {
    try {
      return job.aiContent.outreachEmail
        ? JSON.parse(job.aiContent.outreachEmail) as { subject: string; email: string }
        : null
    } catch { return null }
  }, [job.aiContent.outreachEmail])

  const linkedinText = job.aiContent.linkedinMessage ?? ''
  const hasContent = !!emailData || !!linkedinText

  const handleGenerate = async () => {
    const data = await generate()
    if (!data) return
    if (data.subject !== undefined || data.email !== undefined)
      onAiContent({ outreachEmail: JSON.stringify({ subject: data.subject ?? '', email: data.email ?? '' }) })
    if (data.linkedin) onAiContent({ linkedinMessage: data.linkedin as string })
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h3 className="font-semibold text-sm">Outreach</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Cold email and LinkedIn note to a recruiter at {job.company}. Both generated in one shot.
        </p>
      </div>

      <div className="flex gap-2">
        <Button size="sm" variant={mode === 'email' ? 'default' : 'outline'} onClick={() => setMode('email')}>
          <Mail className="h-3.5 w-3.5 mr-1.5" /> Cold Email
        </Button>
        <Button size="sm" variant={mode === 'linkedin' ? 'default' : 'outline'} onClick={() => setMode('linkedin')}>
          <Send className="h-3.5 w-3.5 mr-1.5" /> LinkedIn Note
        </Button>
      </div>

      {!masterResumeText && <NoResumeBanner onUpload={onUploadResume} />}
      {error && <p className="text-xs text-red-500 p-3 border border-red-200 rounded-lg bg-red-50">{error}</p>}

      {!hasProperInfo && (
        <div className="flex items-start gap-3 p-4 rounded-lg bg-paper-2 border border-line text-sm text-stone">
          <Info className="h-4 w-4 mt-0.5 shrink-0 text-stone/70" />
          <span>
            <span className="font-medium text-ink-soft">Not enough job info.</span>{" "}
            This job is missing a description or company name — outreach generation needs both to produce a personalised message.
            Edit the job to add a description first.
          </span>
        </div>
      )}

      {hasProperInfo && !hasContent ? (
        <Button size="sm" variant="outline" className="gap-2"
          disabled={state === 'loading' || !masterResumeText} onClick={handleGenerate}>
          <Sparkles className={cn("h-3.5 w-3.5", state === 'loading' && "animate-pulse")} />
          {state === 'loading' ? 'Generating…' : 'Generate Outreach Messages'}
        </Button>
      ) : hasProperInfo ? (
        <div className="space-y-4">
          {mode === 'email' && (emailData ? (
            <>
              <div className="rounded-lg border bg-paper-2 p-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone/70">Subject</p>
                <p className="text-sm font-medium">{emailData.subject}</p>
                <CopyButton text={emailData.subject} />
              </div>
              <div className="rounded-lg border bg-paper-2 p-4 space-y-2">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone/70">Body</p>
                <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">{emailData.email}</pre>
                <CopyButton text={emailData.email} />
              </div>
            </>
          ) : <p className="text-sm text-stone/70">Click regenerate to produce the cold email.</p>)}

          {mode === 'linkedin' && (linkedinText ? (
            <div className="rounded-lg border bg-paper-2 p-4 space-y-2">
              <div className="flex items-center justify-between">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-stone/70">LinkedIn Note</p>
                <span className={cn("text-[11px]", linkedinText.length > 280 ? "text-red-500 font-medium" : "text-stone/70")}>
                  {linkedinText.length}/300
                </span>
              </div>
              <pre className="text-sm text-foreground leading-relaxed whitespace-pre-wrap font-sans">{linkedinText}</pre>
              <CopyButton text={linkedinText} />
            </div>
          ) : <p className="text-sm text-stone/70">Click regenerate to produce the LinkedIn note.</p>)}

          <Button size="sm" variant="outline" className="gap-2"
            disabled={state === 'loading' || !masterResumeText} onClick={handleGenerate}>
            <RefreshCw className={cn("h-3.5 w-3.5", state === 'loading' && "animate-spin")} />
            {state === 'loading' ? 'Regenerating…' : 'Regenerate Both'}
          </Button>
        </div>
      ) : null}
    </div>
  )
}

// ── TAB: SALARY ───────────────────────────────────────────────────────────────
function SalaryTab({ job }: { job: CopilotJob }) {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h3 className="font-semibold text-sm">Salary & Negotiation</h3>
        <p className="text-sm text-muted-foreground mt-1">Market data and negotiation talking points for this role.</p>
      </div>
      {job.salary && !['Not specified', 'Competitive'].includes(job.salary) && (
        <div className="border rounded-lg p-4 bg-paper-2">
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium mb-1">Listed Salary</p>
          <p className="text-xl font-bold">{job.salary}</p>
        </div>
      )}
      <ComingSoonBanner feature="Salary Insights & Negotiation Coach" />
      <div className="grid grid-cols-3 gap-3 opacity-50 pointer-events-none select-none">
        {['25th Percentile', 'Median', '75th Percentile'].map(l => (
          <div key={l} className="border rounded-lg p-4 text-center">
            <p className="text-xs text-muted-foreground mb-1">{l}</p>
            <Skeleton className="h-6 w-16 mx-auto" />
          </div>
        ))}
      </div>
    </div>
  )
}

// ── TAB: SKILLS ───────────────────────────────────────────────────────────────
function SkillsTab({ job }: { job: CopilotJob }) {
  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h3 className="font-semibold text-sm">Skill Roadmap</h3>
        <p className="text-sm text-muted-foreground mt-1">Skills this role requires that aren't obvious in your resume, with resources to close the gap.</p>
      </div>
      <ComingSoonBanner feature="Skill Gap Analysis" />
      <div className="space-y-3 opacity-50 pointer-events-none select-none">
        {['High Priority', 'Medium Priority', 'Nice to Have'].map(p => (
          <div key={p} className="border rounded-lg p-4">
            <p className="text-xs font-semibold text-muted-foreground mb-2">{p}</p>
            <SkeletonContent lines={2} />
            <div className="mt-3 flex gap-2">
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-6 w-24 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
const TABS = [
  { id: 'overview',  label: 'Overview',      icon: FileText,   live: true  },
  { id: 'resume',    label: 'Resume',         icon: FileText,   live: true  },
  { id: 'letter',    label: 'Cover Letter',   icon: Mail,       live: true  },
  { id: 'interview', label: 'Interview',      icon: Users,      live: true  },
  { id: 'fit',       label: 'Fit Analysis',   icon: BarChart2,  live: true  },
  { id: 'company',   label: 'Company',        icon: Building2,  live: false },
  { id: 'outreach',  label: 'Outreach',       icon: Send,       live: true  },
  { id: 'salary',    label: 'Salary',         icon: DollarSign, live: false },
  { id: 'skills',    label: 'Skills',         icon: Zap,        live: false },
] as const

export function JobCopilotPanel({ job, masterResume, masterResumeText, onUpdate, onRemove, onUploadResume, detailHref }: JobCopilotPanelProps) {
  const [activeTab, setActiveTab] = useState('overview')

  const handleAiContent = (content: Partial<CopilotJob['aiContent']>) => {
    copilotStore.updateAiContent(job.id, content)
    // Trigger re-render by calling onUpdate with a no-op (aiContent is handled via store directly)
    onUpdate({})
  }

  return (
    <div className="h-full flex flex-col">
      {/* Job header */}
      <div className="shrink-0 px-4 md:px-6 py-3 md:py-4 border-b bg-card">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <h1 className="text-[15px] font-semibold truncate leading-snug">{job.title}</h1>
            <p className="text-[13px] text-stone/70 mt-0.5">
              {job.company}
              {job.location && job.location !== 'Not specified' ? ` · ${job.location}` : ''}
              {job.salary && !['Not specified', 'Competitive'].includes(job.salary) ? ` · ${job.salary}` : ''}
            </p>
          </div>
          <div className="flex items-center gap-2 shrink-0 mt-0.5">
            {/* Match tier badge in header */}
            {job.matchScore !== undefined && (() => {
              const { label, tier } = getMatchTier(job.matchScore)
              const c = MATCH_TIER_COLORS[tier]
              return (
                <span className={cn(
                  'text-[11px] font-semibold px-2 py-0.5 rounded border leading-none',
                  c.text, c.bg, c.border,
                )}>
                  {label}
                </span>
              )
            })()}
            <div className={cn("h-2 w-2 rounded-full", STATUS_COLORS[job.status])} />
            <span className={cn("text-xs font-medium", STATUS_TEXT[job.status])}>{STATUS_LABELS[job.status]}</span>
            {/* Favorite star */}
            <Button
              variant="ghost"
              size="icon"
              aria-label={job.favorite ? 'Remove from favorites' : 'Add to favorites'}
              aria-pressed={job.favorite}
              title={job.favorite ? 'Unfavorite' : 'Favorite'}
              className={cn(
                "h-7 w-7",
                job.favorite ? "text-amber-400 hover:text-amber-500" : "text-stone/40 hover:text-amber-400",
              )}
              onClick={() => onUpdate({ favorite: !job.favorite })}
            >
              <Star className={cn("h-3.5 w-3.5", job.favorite && "fill-amber-400")} />
            </Button>
            {detailHref && (
              <Link href={detailHref}>
                <Button
                  variant="ghost"
                  size="icon"
                  aria-label="Open full detail page"
                  title="Open full detail page"
                  className="h-7 w-7 text-stone/50 hover:text-brand-600"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </Button>
              </Link>
            )}
            <Button
              variant="ghost"
              size="icon"
              aria-label="Remove job"
              className="h-7 w-7 text-stone/70 hover:text-red-500 ml-1"
              onClick={onRemove}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs key={job.id} value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
        <div className="shrink-0 border-b bg-card px-2 md:px-4 overflow-x-auto">
          <TabsList className="h-auto bg-transparent rounded-none p-0 gap-0 w-max">
            {TABS.map(({ id, label, icon: Icon, live }) => (
              <TabsTrigger
                key={id}
                value={id}
                className={cn(
                  "rounded-none border-b-2 border-transparent px-2 md:px-3 py-2.5 text-[11px] md:text-xs font-medium gap-1 relative",
                  "data-[state=active]:border-brand-600 data-[state=active]:text-brand-600 data-[state=active]:bg-transparent",
                  live
                    ? "data-[state=inactive]:text-stone data-[state=inactive]:hover:text-ink"
                    : "data-[state=inactive]:text-stone/40 data-[state=inactive]:hover:text-stone/70",
                )}
              >
                <Icon className="h-3.5 w-3.5" />
                {label}
                {!live && (
                  <span className="absolute top-1.5 right-0.5 text-[8px] font-bold text-stone/40 uppercase leading-none tracking-wide">
                    soon
                  </span>
                )}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 pb-20 md:pb-5">
          <TabsContent forceMount value="overview"  className="mt-0 data-[state=inactive]:hidden"><OverviewTab  job={job} onUpdate={onUpdate} /></TabsContent>
          <TabsContent forceMount value="resume"    className="mt-0 data-[state=inactive]:hidden"><ResumeTab    job={job} masterResume={masterResume} masterResumeText={masterResumeText} onAiContent={handleAiContent} onUploadResume={onUploadResume} /></TabsContent>
          <TabsContent forceMount value="letter"    className="mt-0 data-[state=inactive]:hidden"><CoverLetterTab job={job} masterResumeText={masterResumeText} onAiContent={handleAiContent} onUploadResume={onUploadResume} /></TabsContent>
          <TabsContent forceMount value="interview" className="mt-0 data-[state=inactive]:hidden"><InterviewTab   job={job} masterResumeText={masterResumeText} onAiContent={handleAiContent} onUploadResume={onUploadResume} /></TabsContent>
          <TabsContent forceMount value="fit"       className="mt-0 data-[state=inactive]:hidden"><FitTab         job={job} masterResumeText={masterResumeText} onAiContent={handleAiContent} onUploadResume={onUploadResume} /></TabsContent>
          <TabsContent forceMount value="company"   className="mt-0 data-[state=inactive]:hidden"><CompanyTab     job={job} /></TabsContent>
          <TabsContent forceMount value="outreach"  className="mt-0 data-[state=inactive]:hidden"><OutreachTab    job={job} masterResumeText={masterResumeText} onAiContent={handleAiContent} onUploadResume={onUploadResume} /></TabsContent>
          <TabsContent forceMount value="salary"    className="mt-0 data-[state=inactive]:hidden"><SalaryTab      job={job} /></TabsContent>
          <TabsContent forceMount value="skills"    className="mt-0 data-[state=inactive]:hidden"><SkillsTab      job={job} /></TabsContent>
        </div>
      </Tabs>
    </div>
  )
}
