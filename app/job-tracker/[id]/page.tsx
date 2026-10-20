"use client"

import { useState, useEffect, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { CopilotJob } from "@/types/copilot-job"
import { copilotStore } from "@/lib/copilot-store"
import { masterResume } from "@/lib/master-resume"
import { JobCopilotPanel } from "@/components/job-copilot-panel"
import { Button } from "@/components/ui/button"
import { ArrowLeft, ExternalLink, Loader2 } from "lucide-react"

export default function JobDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = params.id as string

  const [job, setJob] = useState<CopilotJob | null>(null)
  const [ready, setReady] = useState(false)
  const [resumeText, setResumeText] = useState<string | null>(null)

  useEffect(() => {
    const cached = copilotStore.get(id)
    if (cached) setJob(cached)
    setReady(true)
    setResumeText(masterResume.get())
    copilotStore.hydrate().then(jobs => {
      const found = jobs.find(j => j.id === id) ?? null
      if (found) setJob(found)
    })
  }, [id])

  const handleUpdate = useCallback((updates: Partial<CopilotJob>) => {
    setJob(prev => {
      if (!prev) return prev
      const next = { ...prev, ...updates }
      copilotStore.update(prev.id, updates)
      return next
    })
  }, [])

  const handleRemove = useCallback(() => {
    if (job) copilotStore.remove(job.id)
    router.push("/workspace")
  }, [job, router])

  if (!ready) {
    return (
      <div className="h-screen bg-paper flex items-center justify-center">
        <Loader2 className="h-5 w-5 animate-spin text-stone/50" />
      </div>
    )
  }

  if (!job) {
    return (
      <div className="h-screen bg-paper flex flex-col items-center justify-center gap-4 text-center px-8">
        <p className="text-[15px] font-semibold text-ink">Job not found</p>
        <p className="text-[13px] text-stone">This job may have been removed or the link is outdated.</p>
        <Link href="/workspace">
          <Button size="sm" variant="outline" className="gap-1.5">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-paper">
      {/* Slim top bar */}
      <header className="shrink-0 flex items-center gap-2 px-3 py-2 border-b border-line bg-card">
        <Link href="/workspace">
          <Button
            variant="ghost"
            size="sm"
            className="h-7 gap-1.5 text-[12px] text-stone hover:text-ink"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Dashboard
          </Button>
        </Link>
        <div className="h-4 w-px bg-line" />
        <span className="text-[12px] text-stone/70 truncate flex-1 min-w-0">
          {job.title} · {job.company}
        </span>
        {job.applyUrl && (
          <a
            href={job.applyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0"
          >
            <Button
              size="sm"
              variant="outline"
              className="h-7 gap-1.5 text-[12px] border-brand-200 text-brand-700 hover:bg-brand-50"
            >
              <ExternalLink className="h-3 w-3" />
              Apply
            </Button>
          </a>
        )}
      </header>

      {/* Panel fills remaining height */}
      <div className="flex-1 overflow-hidden">
        <JobCopilotPanel
          job={job}
          masterResume={null}
          masterResumeText={resumeText}
          onUpdate={handleUpdate}
          onRemove={handleRemove}
        />
      </div>
    </div>
  )
}
