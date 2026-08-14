"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { CopilotJob } from "@/types/copilot-job"
import { Download, Trash2, Save, MapPin, CheckCircle2 } from "lucide-react"
import { cn } from "@/lib/utils"

type WorkStyle = "Remote" | "Hybrid" | "On-site" | "Open to all"
type Seniority = "Junior" | "Mid-level" | "Senior" | "Lead" | "Any"

interface Prefs {
  role: string
  location: string
  country_code: string | null
  is_remote: boolean
  workStyle: WorkStyle
  seniority: Seniority
  resumeText: string
}

const WORK_STYLES: WorkStyle[] = ["Remote", "Hybrid", "On-site", "Open to all"]
const SENIORITIES: Seniority[] = ["Junior", "Mid-level", "Senior", "Lead", "Any"]

interface SettingsPanelProps {
  jobs: CopilotJob[]
  onClearWorkspace: () => void
}

export function SettingsPanel({ jobs, onClearWorkspace }: SettingsPanelProps) {
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [savedPrefs, setSavedPrefs] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gj_onboarded")
      if (stored) setPrefs(JSON.parse(stored) as Prefs)
    } catch { /* ignore */ }
  }, [])

  const savePrefs = () => {
    if (!prefs) return
    localStorage.setItem("gj_onboarded", JSON.stringify(prefs))
    setSavedPrefs(true)
    setTimeout(() => setSavedPrefs(false), 2000)
  }

  const exportExcel = async () => {
    const XLSX = await import("xlsx")
    const cols: (keyof CopilotJob)[] = [
      "title", "company", "location", "status", "salary",
      "matchScore", "source", "addedAt", "appliedAt", "applyUrl", "notes",
    ]
    const HEADERS: Record<string, string> = {
      title: "Job Title", company: "Company", location: "Location",
      status: "Status", salary: "Salary", matchScore: "Match Score (%)",
      source: "Source", addedAt: "Added", appliedAt: "Applied",
      applyUrl: "Apply URL", notes: "Notes",
    }
    const rows = jobs.map(j =>
      Object.fromEntries(cols.map(k => {
        const v = j[k]
        return [HEADERS[k], v == null ? "" : v]
      }))
    )
    const ws = XLSX.utils.json_to_sheet(rows)
    // Column widths
    ws["!cols"] = [28, 22, 20, 14, 18, 14, 12, 14, 14, 40, 30].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Jobs")
    XLSX.writeFile(wb, `goosejobs-${today()}.xlsx`)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(jobs, null, 2)], { type: "application/json" })
    triggerDownload(blob, `goosejobs-${today()}.json`)
  }

  return (
    <div className="flex-1 p-4 md:p-8 overflow-auto pb-16 md:pb-0">
      <h2 className="text-xl font-bold tracking-tight mb-1">Settings</h2>
      <p className="text-[13px] text-zinc-400 mb-6">Manage your search preferences, data, and workspace.</p>

      <div className="space-y-5 max-w-xl">

        {/* ── Search Preferences ───────────────────────────────────────── */}
        <Section title="Search Preferences" description="Used for your next AI job search.">
          {prefs ? (
            <div className="space-y-4">
              <Field label="Target role">
                <Input
                  value={prefs.role}
                  onChange={e => setPrefs({ ...prefs, role: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  className="h-8 text-[12px]"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Seniority level">
                  <Select value={prefs.seniority} onValueChange={v => setPrefs({ ...prefs, seniority: v as Seniority })}>
                    <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SENIORITIES.map(s => (
                        <SelectItem key={s} value={s} className="text-[12px]">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="Work style">
                  <Select value={prefs.workStyle} onValueChange={v => setPrefs({ ...prefs, workStyle: v as WorkStyle })}>
                    <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORK_STYLES.map(s => (
                        <SelectItem key={s} value={s} className="text-[12px]">{s}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
              </div>

              <Field label="Location">
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-zinc-300 pointer-events-none" />
                  <Input
                    value={prefs.location}
                    className="h-8 text-[12px] pl-7 bg-zinc-50 text-zinc-400"
                    readOnly
                    title="Location is set when you start a new search"
                  />
                </div>
                <p className="text-[11px] text-zinc-400 mt-1">
                  Location is locked to your last search. Start a new AI search to change it.
                </p>
              </Field>

              <Button
                size="sm"
                className={cn(
                  "gap-1.5 text-[12px] transition-all",
                  savedPrefs
                    ? "bg-emerald-600 hover:bg-emerald-600 text-white"
                    : "bg-indigo-600 hover:bg-indigo-700 text-white",
                )}
                onClick={savePrefs}
              >
                {savedPrefs
                  ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
                  : <><Save className="h-3.5 w-3.5" /> Save preferences</>
                }
              </Button>
            </div>
          ) : (
            <p className="text-[12px] text-zinc-400">
              No preferences found. Complete{" "}
              <a href="/onboarding" className="text-indigo-600 underline">onboarding</a> first.
            </p>
          )}
        </Section>

        {/* ── Export Data ──────────────────────────────────────────────── */}
        <Section title="Export Data" description={`${jobs.length} job${jobs.length !== 1 ? "s" : ""} in your workspace.`}>
          <div className="flex gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-[12px] border-emerald-200 text-emerald-700 hover:bg-emerald-50"
              onClick={exportExcel}
              disabled={jobs.length === 0}
            >
              <Download className="h-3.5 w-3.5" /> Export Excel (.xlsx)
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-1.5 text-[12px]"
              onClick={exportJson}
              disabled={jobs.length === 0}
            >
              <Download className="h-3.5 w-3.5" /> Export JSON
            </Button>
          </div>
          {jobs.length === 0 && (
            <p className="text-[11px] text-zinc-400 mt-1">Add jobs to your workspace to enable export.</p>
          )}
        </Section>

        {/* ── Danger Zone ─────────────────────────────────────────────── */}
        <Section title="Danger Zone" description="Permanently clear all jobs and preferences from this browser." danger>
          <Button
            variant="destructive"
            size="sm"
            className="gap-1.5 text-[12px]"
            onClick={onClearWorkspace}
          >
            <Trash2 className="h-3.5 w-3.5" /> Clear Workspace &amp; Re-onboard
          </Button>
        </Section>

      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Section({
  title,
  description,
  danger,
  children,
}: {
  title: string
  description?: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn("p-5 border rounded-xl bg-white space-y-4", danger && "border-red-100")}>
      <div>
        <h3 className={cn("font-semibold text-[14px]", danger && "text-red-600")}>{title}</h3>
        {description && <p className="text-[12px] text-zinc-400 mt-0.5">{description}</p>}
      </div>
      {children}
    </div>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px] font-medium text-zinc-700">{label}</Label>
      {children}
    </div>
  )
}

function today() {
  return new Date().toISOString().slice(0, 10)
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  setTimeout(() => {
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, 100)
}
