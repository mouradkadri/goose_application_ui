"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { CopilotJob } from "@/types/copilot-job"
import { Link2, PenLine, Loader2 } from "lucide-react"

type NewJob = Omit<CopilotJob, 'id' | 'addedAt' | 'aiContent'>

interface AddJobModalProps {
  onClose: () => void
  onAdd: (job: NewJob) => void
  /** Called with the raw scraped job dict when URL import succeeds. If provided, the modal closes automatically. */
  onImportUrl?: (rawJob: Record<string, unknown>) => void
}

export function AddJobModal({ onClose, onAdd, onImportUrl }: AddJobModalProps) {
  const [tab, setTab] = useState<'url' | 'manual'>('manual')
  const [url, setUrl] = useState('')
  const [isFetching, setIsFetching] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)

  const [form, setForm] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    applyUrl: '',
    description: '',
  })

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm(prev => ({ ...prev, [field]: e.target.value }))

  const handleFetchUrl = async () => {
    const trimmedUrl = url.trim()
    if (!trimmedUrl) return
    setIsFetching(true)
    setFetchError(null)
    try {
      const res = await fetch('/api/scrape-job', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: trimmedUrl }),
      })
      const data = await res.json() as Record<string, unknown>
      if (!res.ok) {
        throw new Error((data.error as string) || `Error ${res.status}`)
      }
      if (onImportUrl) {
        // Auto-add mode: hand off to parent which persists + selects the job
        onImportUrl(data)
        onClose()
      } else {
        // Fallback: populate manual form for review
        setForm({
          title: String(data.title ?? ''),
          company: String(data.company ?? ''),
          location: String(data.location ?? ''),
          salary: String(data.salary ?? ''),
          applyUrl: String(data.apply_url ?? trimmedUrl),
          description: String(data.description ?? ''),
        })
        setTab('manual')
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to read job posting'
      setFetchError(msg.slice(0, 200))
      // Graceful fallback: pre-fill the URL and let user complete manually
      setForm(prev => ({ ...prev, applyUrl: trimmedUrl }))
      setTab('manual')
    } finally {
      setIsFetching(false)
    }
  }

  const handleSubmit = () => {
    if (!form.title.trim() || !form.company.trim()) return
    onAdd({
      title: form.title.trim(),
      company: form.company.trim(),
      location: form.location.trim() || 'Not specified',
      salary: form.salary.trim() || 'Not specified',
      description: form.description.trim(),
      requirements: [],
      applyUrl: form.applyUrl.trim(),
      source: 'manual',
      status: 'to_apply',
      notes: '',
      favorite: false,
    })
  }

  const isValid = form.title.trim() && form.company.trim()

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold">Add a job</DialogTitle>
        </DialogHeader>

        <Tabs value={tab} onValueChange={v => setTab(v as 'url' | 'manual')}>
          <TabsList className="w-full grid grid-cols-2 mb-4">
            <TabsTrigger value="url" className="gap-2 text-sm">
              <Link2 className="h-3.5 w-3.5" /> Paste URL
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2 text-sm">
              <PenLine className="h-3.5 w-3.5" /> Enter manually
            </TabsTrigger>
          </TabsList>

          <TabsContent value="url" className="space-y-3 mt-0">
            <p className="text-sm text-muted-foreground">
              Paste any job posting URL — we&apos;ll extract the details automatically.
            </p>
            <div className="flex gap-2">
              <Input
                placeholder="https://jobs.company.com/..."
                value={url}
                onChange={e => { setUrl(e.target.value); setFetchError(null) }}
                onKeyDown={e => e.key === 'Enter' && handleFetchUrl()}
                disabled={isFetching}
              />
              <Button onClick={handleFetchUrl} disabled={!url.trim() || isFetching} className="shrink-0">
                {isFetching ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Import'}
              </Button>
            </div>
            {isFetching && (
              <p className="text-xs text-indigo-600 font-medium">Reading the posting…</p>
            )}
            {fetchError && (
              <p className="text-xs text-red-600">
                {fetchError} — fields pre-filled below, please complete manually.
              </p>
            )}
          </TabsContent>

          <TabsContent value="manual" className="space-y-3 mt-0">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Job Title <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Data Engineer" value={form.title} onChange={set('title')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Company <span className="text-red-500">*</span></Label>
                <Input placeholder="e.g. Mistral AI" value={form.company} onChange={set('company')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Location</Label>
                <Input placeholder="e.g. Remote / Paris" value={form.location} onChange={set('location')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Salary</Label>
                <Input placeholder="e.g. €80K – €110K" value={form.salary} onChange={set('salary')} />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Apply URL</Label>
              <Input placeholder="https://..." value={form.applyUrl} onChange={set('applyUrl')} />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Job Description</Label>
              <Textarea
                placeholder="Paste the full job description here..."
                className="min-h-[120px] resize-none text-sm"
                value={form.description}
                onChange={set('description')}
              />
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
              <Button size="sm" onClick={handleSubmit} disabled={!isValid}>Add Job</Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  )
}
