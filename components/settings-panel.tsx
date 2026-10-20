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
import { CopilotJob, STATUS_LABELS, REJECTION_REASON_LABELS } from "@/types/copilot-job"
import { searchSessions } from "@/lib/search-sessions"
import {
  Download, Trash2, Save, MapPin, CheckCircle2, Target, Mail,
  X, Send, Plus, Clock, AlertTriangle, BriefcaseBusiness,
  BarChart3, Inbox,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
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

interface DigestLocation {
  label: string
  country_code: string | null
  is_remote: boolean
  experience_level?: string | null
}
interface DigestPrefs {
  enabled: boolean
  notify_email: string
  locations: DigestLocation[]
  min_score: number
  top_n: number
  send_hour_utc: number
  last_sent_at: string | null
}

interface SettingsPanelProps {
  jobs: CopilotJob[]
  onClearWorkspace: () => void
}

// Tunisia is UTC+1 all year (no DST since 2009)
function toTunisiaTime(utcHour: number) {
  const h = (utcHour + 1) % 24
  const period = h < 12 ? "am" : "pm"
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h
  return `${h12}:00 ${period} (Tunisia)`
}

const DIGEST_BASE = '/api/digest'

export function SettingsPanel({ jobs, onClearWorkspace }: SettingsPanelProps) {
  // ── General prefs ─────────────────────────────────────────────────────────
  const [prefs, setPrefs] = useState<Prefs | null>(null)
  const [savedPrefs, setSavedPrefs] = useState(false)
  const [weeklyGoal, setWeeklyGoal] = useState(10)
  const [goalSaved, setGoalSaved] = useState(false)
  const [exportSessionId, setExportSessionId] = useState<string>('all')
  const sessions = searchSessions.getAll()

  // ── Daily Digest ──────────────────────────────────────────────────────────
  const [digest, setDigest] = useState<DigestPrefs | null>(null)
  const [digestSaved, setDigestSaved] = useState(false)
  const [digestSending, setDigestSending] = useState(false)
  const [digestSendResult, setDigestSendResult] = useState<string | null>(null)

  // Add-location form
  const [showAddLoc, setShowAddLoc] = useState(false)
  const [newLocLabel, setNewLocLabel] = useState('')
  const [newLocCode, setNewLocCode] = useState('')
  const [newLocRemote, setNewLocRemote] = useState(false)
  const [newLocExpLevel, setNewLocExpLevel] = useState('')

  useEffect(() => {
    try {
      const stored = localStorage.getItem("gj_onboarded")
      if (stored) setPrefs(JSON.parse(stored) as Prefs)
      const goal = localStorage.getItem("gj_weekly_goal")
      if (goal) setWeeklyGoal(Number(goal))
    } catch { /* ignore */ }

    fetch(`${DIGEST_BASE}/preferences`, { credentials: 'include' })
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data) setDigest(data) })
      .catch(() => {})
  }, [])

  // ── Handlers ──────────────────────────────────────────────────────────────

  const savePrefs = () => {
    if (!prefs) return
    localStorage.setItem("gj_onboarded", JSON.stringify(prefs))
    setSavedPrefs(true)
    setTimeout(() => setSavedPrefs(false), 2000)
  }

  const saveGoal = () => {
    localStorage.setItem("gj_weekly_goal", String(weeklyGoal))
    setGoalSaved(true)
    setTimeout(() => setGoalSaved(false), 2000)
  }

  const saveDigest = async () => {
    if (!digest) return
    try {
      await fetch(`${DIGEST_BASE}/preferences`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(digest),
      })
      setDigestSaved(true)
      setTimeout(() => setDigestSaved(false), 2500)
    } catch { /* ignore */ }
  }

  const sendTestDigest = async () => {
    setDigestSending(true)
    setDigestSendResult(null)
    try {
      const r = await fetch(`${DIGEST_BASE}/trigger`, { method: 'POST', credentials: 'include' })
      const data = await r.json()
      if (r.ok) {
        setDigestSendResult(`Sent! ${data.jobs} job${data.jobs !== 1 ? 's' : ''} in your inbox.`)
      } else {
        setDigestSendResult(data.detail || 'Could not send — check your settings.')
      }
    } catch (e: unknown) {
      setDigestSendResult(e instanceof Error ? e.message : 'Network error.')
    } finally {
      setDigestSending(false)
    }
  }

  const addLocation = () => {
    if (!newLocLabel.trim() || !digest) return
    const loc: DigestLocation = {
      label: newLocLabel.trim(),
      country_code: newLocCode.trim().toUpperCase() || null,
      is_remote: newLocRemote,
      experience_level: newLocExpLevel || null,
    }
    setDigest({ ...digest, locations: [...digest.locations, loc] })
    setNewLocLabel('')
    setNewLocCode('')
    setNewLocRemote(false)
    setNewLocExpLevel('')
    setShowAddLoc(false)
  }

  const removeLocation = (idx: number) => {
    if (!digest) return
    setDigest({ ...digest, locations: digest.locations.filter((_, i) => i !== idx) })
  }

  // ── Export ────────────────────────────────────────────────────────────────

  const filteredForExport = (jobList: CopilotJob[]) =>
    exportSessionId === 'all' ? jobList : jobList.filter(j => j.searchSessionId === exportSessionId)

  const buildRows = (jobList: CopilotJob[]) => {
    const fmtDate = (iso?: string) => iso ? iso.slice(0, 10) : ""
    return jobList.map(j => ({
      "Job Title":         j.title,
      "Company":           j.company,
      "Location":          j.location,
      "Status":            STATUS_LABELS[j.status] ?? j.status,
      "Salary":            j.salary ?? "",
      "Match Score (%)":   j.matchScore ?? "",
      "Source":            j.source,
      "Date Added":        fmtDate(j.addedAt),
      "Date Applied":      fmtDate(j.appliedAt),
      "Deadline":          fmtDate(j.deadline),
      "Follow-up Date":    fmtDate(j.followUpAt),
      "Rejection Reason":  j.rejectionReason ? (REJECTION_REASON_LABELS[j.rejectionReason] ?? j.rejectionReason) : "",
      "Connections":       j.connections ?? "",
      "Contact":           j.contact ?? "",
      "Cover Letter":      j.aiContent?.coverLetter ? "Yes" : "No",
      "Starred":           j.favorite ? "★" : "",
      "Apply URL":         j.applyUrl,
      "Notes":             j.notes,
    }))
  }

  const exportExcel = async () => {
    const XLSX = await import("xlsx")
    const rows = buildRows(filteredForExport(jobs))
    const ws = XLSX.utils.json_to_sheet(rows)
    ws["!cols"] = [28,22,20,14,16,14,12,12,12,12,12,18,28,28,12,8,40,36].map(w => ({ wch: w }))
    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, ws, "Jobs")
    XLSX.writeFile(wb, `goosejobs-${today()}.xlsx`)
  }

  const exportCsv = () => {
    const rows = buildRows(filteredForExport(jobs))
    if (rows.length === 0) return
    const headers = Object.keys(rows[0])
    const csvRows = [
      headers.map(h => `"${h}"`).join(","),
      ...rows.map(row => Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
    ]
    const blob = new Blob([csvRows.join("\n")], { type: "text/csv;charset=utf-8;" })
    triggerDownload(blob, `goosejobs-${today()}.csv`)
  }

  const exportJson = () => {
    const blob = new Blob([JSON.stringify(filteredForExport(jobs), null, 2)], { type: "application/json" })
    triggerDownload(blob, `goosejobs-${today()}.json`)
  }

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="flex-1 overflow-auto pb-20 md:pb-0">
      {/* Page header */}
      <div className="sticky top-0 z-10 bg-paper border-b border-line px-6 py-4">
        <h2 className="text-[15px] font-bold tracking-tight text-ink">Settings</h2>
        <p className="text-[12px] text-stone mt-0.5">Preferences, digest, and data management.</p>
      </div>

      <div className="px-4 md:px-6 py-5 space-y-4 max-w-2xl">

        {/* ── 1. Profile & Preferences ──────────────────────────────────── */}
        <SettingsCard
          icon={<BriefcaseBusiness className="h-4 w-4" />}
          title="Profile & Preferences"
          description="Used for your AI job searches."
        >
          {prefs ? (
            <div className="space-y-4">
              <FieldRow label="Target role">
                <Input
                  value={prefs.role}
                  onChange={e => setPrefs({ ...prefs, role: e.target.value })}
                  placeholder="e.g. Software Engineer"
                  className="h-8 text-[12px]"
                />
              </FieldRow>

              <div className="grid grid-cols-2 gap-3">
                <FieldRow label="Seniority">
                  <Select value={prefs.seniority} onValueChange={v => setPrefs({ ...prefs, seniority: v as Seniority })}>
                    <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {SENIORITIES.map(s => <SelectItem key={s} value={s} className="text-[12px]">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldRow>
                <FieldRow label="Work style">
                  <Select value={prefs.workStyle} onValueChange={v => setPrefs({ ...prefs, workStyle: v as WorkStyle })}>
                    <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {WORK_STYLES.map(s => <SelectItem key={s} value={s} className="text-[12px]">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </FieldRow>
              </div>

              <FieldRow label="Location">
                <div className="relative">
                  <MapPin className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-stone/40 pointer-events-none" />
                  <Input value={prefs.location} className="h-8 text-[12px] pl-7 text-stone/60" readOnly
                    title="Set when you start a new AI search" />
                </div>
                <p className="text-[11px] text-stone/60 mt-1">Updated each time you run a new AI search.</p>
              </FieldRow>

              <div className="pt-1 border-t border-line">
                <FieldRow label="Weekly application goal">
                  <div className="flex items-center gap-2">
                    <Target className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                    <Input type="number" min={1} max={100} value={weeklyGoal}
                      onChange={e => setWeeklyGoal(Math.max(1, Number(e.target.value)))}
                      className="h-8 text-[12px] w-20" />
                    <span className="text-[11px] text-stone">applications / week</span>
                  </div>
                </FieldRow>
              </div>

              <div className="flex gap-2 pt-1">
                <SaveButton saved={savedPrefs} onClick={() => { savePrefs(); saveGoal() }} label="Save preferences" />
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-stone">
              No preferences found.{" "}
              <a href="/onboarding" className="text-brand-600 underline">Complete onboarding</a> first.
            </p>
          )}
        </SettingsCard>

        {/* ── 2. Daily Job Digest (Featured) ───────────────────────────── */}
        <div className={cn(
          "rounded-lg border-2 overflow-hidden transition-colors",
          digest?.enabled ? "border-brand-300 bg-brand-50/30" : "border-line bg-card",
        )}>
          {/* Section header */}
          <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-line/60">
            <div className="flex items-start gap-3 min-w-0">
              <div className={cn(
                "h-8 w-8 rounded-md flex items-center justify-center shrink-0 mt-0.5",
                digest?.enabled ? "bg-brand-100 text-brand-600" : "bg-paper-2 text-stone",
              )}>
                <Inbox className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <h3 className="text-[14px] font-bold text-ink">Daily Job Digest</h3>
                  {digest && (
                    <span className={cn(
                      "text-[10px] font-semibold px-2 py-0.5 rounded-full border leading-none",
                      digest.enabled
                        ? "bg-pine-mid/10 text-pine-mid border-pine-mid/20"
                        : "bg-paper-2 text-stone border-line"
                    )}>
                      {digest.enabled ? "● Active" : "○ Inactive"}
                    </span>
                  )}
                </div>
                <p className="text-[12px] text-stone mt-0.5">
                  Get a ranked Excel of your top matches delivered every morning.
                </p>
              </div>
            </div>
            {digest && (
              <Switch
                checked={digest.enabled}
                onCheckedChange={v => setDigest({ ...digest, enabled: v })}
                className="mt-1 shrink-0"
                aria-label="Enable daily digest"
              />
            )}
          </div>

          <div className="px-5 py-4">
            {digest ? (
              <div className="space-y-5">

                {/* Delivery email */}
                <FieldRow label="Delivery email">
                  <div className="relative">
                    <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3 w-3 text-stone/40 pointer-events-none" />
                    <Input
                      value={digest.notify_email}
                      onChange={e => setDigest({ ...digest, notify_email: e.target.value })}
                      placeholder="you@email.com"
                      className="h-8 text-[12px] pl-7"
                    />
                  </div>
                </FieldRow>

                {/* Locations */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[12px] font-semibold text-ink-soft">Search locations</Label>
                    <span className="text-[11px] text-stone">{digest.locations.length} configured</span>
                  </div>

                  {/* Location rows */}
                  {digest.locations.length > 0 ? (
                    <div className="rounded-md border border-line overflow-hidden divide-y divide-line">
                      {digest.locations.map((loc, i) => (
                        <div key={i} className="flex items-center gap-2 px-3 py-2 bg-card hover:bg-paper-2/50 transition-colors">
                          <span className="text-base leading-none shrink-0">{loc.is_remote ? '🌐' : '📍'}</span>
                          <div className="flex-1 min-w-0">
                            <span className="text-[12px] font-medium text-ink">{loc.label}</span>
                            {loc.country_code && (
                              <span className="ml-1.5 text-[11px] text-stone">({loc.country_code})</span>
                            )}
                            {loc.country_code === 'TN' && (
                              <span className="ml-1 text-[10px] text-amber-600 font-semibold" title="Tunisia geo-boost ×1.5 active">⚡ boost</span>
                            )}
                          </div>
                          {loc.experience_level ? (
                            <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-brand-50 text-brand-600 border border-brand-100 capitalize shrink-0">
                              {loc.experience_level}
                            </span>
                          ) : (
                            <span className="text-[10px] text-stone/50 shrink-0">auto level</span>
                          )}
                          <button
                            onClick={() => removeLocation(i)}
                            aria-label={`Remove ${loc.label}`}
                            className="ml-1 text-stone/40 hover:text-clay transition-colors shrink-0"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-md border border-dashed border-line p-4 text-center">
                      <p className="text-[12px] text-stone">No locations added yet.</p>
                      <p className="text-[11px] text-stone/60 mt-0.5">Add at least one location to receive your digest.</p>
                    </div>
                  )}

                  {/* Add location */}
                  {!showAddLoc ? (
                    <button
                      onClick={() => setShowAddLoc(true)}
                      className="flex items-center gap-1.5 text-[12px] text-brand-600 hover:text-brand-700 font-medium transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" /> Add location
                    </button>
                  ) : (
                    <div className="rounded-md border border-brand-200 bg-brand-50/40 p-3 space-y-3">
                      <p className="text-[11px] font-semibold text-ink-soft uppercase tracking-wide">New location</p>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldRow label="Label">
                          <Input value={newLocLabel} onChange={e => setNewLocLabel(e.target.value)}
                            placeholder="e.g. Tunisia" className="h-7 text-[11px]"
                            onKeyDown={e => e.key === 'Enter' && addLocation()} />
                        </FieldRow>
                        <FieldRow label="Country code">
                          <Input value={newLocCode} onChange={e => setNewLocCode(e.target.value)}
                            placeholder="TN / US…" className="h-7 text-[11px] uppercase" maxLength={2}
                            onKeyDown={e => e.key === 'Enter' && addLocation()} />
                        </FieldRow>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <FieldRow label="Seniority override">
                          <Select value={newLocExpLevel || "auto"} onValueChange={v => setNewLocExpLevel(v === "auto" ? "" : v)}>
                            <SelectTrigger className="h-7 text-[11px]"><SelectValue /></SelectTrigger>
                            <SelectContent>
                              <SelectItem value="auto" className="text-[11px]">Auto (from resume)</SelectItem>
                              <SelectItem value="entry" className="text-[11px]">Entry</SelectItem>
                              <SelectItem value="mid" className="text-[11px]">Mid</SelectItem>
                              <SelectItem value="senior" className="text-[11px]">Senior</SelectItem>
                              <SelectItem value="executive" className="text-[11px]">Executive</SelectItem>
                            </SelectContent>
                          </Select>
                        </FieldRow>
                        <FieldRow label="Type">
                          <div className="flex items-center gap-2 h-7">
                            <Switch id="new-loc-remote" checked={newLocRemote} onCheckedChange={setNewLocRemote} />
                            <Label htmlFor="new-loc-remote" className="text-[11px] cursor-pointer">Remote search</Label>
                          </div>
                        </FieldRow>
                      </div>
                      {newLocCode.toUpperCase() === 'TN' && (
                        <p className="text-[10px] text-amber-700 bg-amber-50 border border-amber-100 rounded px-2 py-1">
                          ⚡ Tunisia detected — a ×1.5 score boost will be applied automatically to Tunisian listings.
                        </p>
                      )}
                      <div className="flex gap-2 pt-1">
                        <Button size="sm" className="h-7 text-[11px] bg-brand-600 hover:bg-brand-700 text-white"
                          onClick={addLocation} disabled={!newLocLabel.trim()}>
                          Add location
                        </Button>
                        <Button size="sm" variant="ghost" className="h-7 text-[11px]"
                          onClick={() => { setShowAddLoc(false); setNewLocLabel(''); setNewLocCode('') }}>
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Scoring & timing */}
                <div className="space-y-3 pt-1 border-t border-line/60">
                  <p className="text-[11px] font-semibold text-stone uppercase tracking-wide">Scoring & delivery</p>
                  <div className="grid grid-cols-3 gap-3">
                    <FieldRow label="Min match score">
                      <div className="flex items-center gap-1.5">
                        <Input type="number" min={0} max={1} step={0.05} value={digest.min_score}
                          onChange={e => setDigest({ ...digest, min_score: Math.min(1, Math.max(0, Number(e.target.value))) })}
                          className="h-8 text-[12px] w-16" />
                        <span className="text-[11px] text-stone shrink-0">{Math.round(digest.min_score * 100)}%</span>
                      </div>
                    </FieldRow>
                    <FieldRow label="Jobs per location">
                      <div className="flex items-center gap-1.5">
                        <Input type="number" min={1} max={50} value={digest.top_n}
                          onChange={e => setDigest({ ...digest, top_n: Math.min(50, Math.max(1, Number(e.target.value))) })}
                          className="h-8 text-[12px] w-16" />
                        <span className="text-[11px] text-stone shrink-0">
                          = {digest.top_n * (digest.locations.length || 1)} total
                        </span>
                      </div>
                    </FieldRow>
                    <FieldRow label="Send time (UTC)">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3 w-3 text-stone/50 shrink-0" />
                          <Input type="number" min={0} max={23} value={digest.send_hour_utc}
                            onChange={e => setDigest({ ...digest, send_hour_utc: Math.min(23, Math.max(0, Number(e.target.value))) })}
                            className="h-8 text-[12px] w-16" />
                          <span className="text-[11px] text-stone shrink-0">:00 UTC</span>
                        </div>
                        <p className="text-[10px] text-brand-600 font-medium pl-4">
                          → {toTunisiaTime(digest.send_hour_utc)}
                        </p>
                      </div>
                    </FieldRow>
                  </div>
                </div>

                {/* Last sent + actions */}
                {digest.last_sent_at && (
                  <p className="text-[11px] text-stone flex items-center gap-1.5">
                    <CheckCircle2 className="h-3 w-3 text-pine-mid shrink-0" />
                    Last sent: {new Date(digest.last_sent_at).toLocaleString()}
                  </p>
                )}

                <div className="flex gap-2 flex-wrap items-center pt-1 border-t border-line/60">
                  <SaveButton saved={digestSaved} onClick={saveDigest} label="Save digest settings" />
                  <Button size="sm" variant="outline" className="gap-1.5 text-[12px] h-8"
                    onClick={sendTestDigest} disabled={digestSending}>
                    <Send className="h-3.5 w-3.5" />
                    {digestSending ? 'Sending…' : 'Send test email'}
                  </Button>
                </div>

                {digestSendResult && (
                  <p className={cn(
                    "text-[12px] flex items-center gap-1.5 mt-1",
                    digestSendResult.startsWith('Sent') ? "text-pine-mid" : "text-clay"
                  )}>
                    {digestSendResult.startsWith('Sent')
                      ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                      : <AlertTriangle className="h-3.5 w-3.5 shrink-0" />}
                    {digestSendResult}
                  </p>
                )}
              </div>
            ) : (
              <div className="py-2 text-center space-y-2">
                <p className="text-[13px] text-stone">Sign in to configure your daily digest.</p>
                <a href="/login" className="inline-block text-[12px] text-brand-600 underline font-medium">
                  Log in →
                </a>
              </div>
            )}
          </div>
        </div>

        {/* ── 3. Export Data ────────────────────────────────────────────── */}
        <SettingsCard
          icon={<BarChart3 className="h-4 w-4" />}
          title="Export Data"
          description={`${jobs.length} job${jobs.length !== 1 ? "s" : ""} in your workspace.`}
        >
          {sessions.length > 1 && (
            <FieldRow label="Export scope">
              <Select value={exportSessionId} onValueChange={setExportSessionId}>
                <SelectTrigger className="h-8 text-[12px]"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="text-[12px]">All jobs ({jobs.length})</SelectItem>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.id} className="text-[12px]">
                      {s.resumeName.replace(/\.[^.]+$/, '')} — {new Date(s.startedAt).toLocaleDateString()} ({s.jobCount} jobs)
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FieldRow>
          )}
          <div className="flex gap-2 flex-wrap">
            <Button variant="outline" size="sm" className="gap-1.5 text-[12px] border-emerald-200 text-emerald-700 hover:bg-emerald-50 h-8"
              onClick={exportExcel} disabled={jobs.length === 0}>
              <Download className="h-3.5 w-3.5" /> Excel (.xlsx)
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-[12px] border-blue-200 text-blue-700 hover:bg-blue-50 h-8"
              onClick={exportCsv} disabled={jobs.length === 0}>
              <Download className="h-3.5 w-3.5" /> CSV
            </Button>
            <Button variant="outline" size="sm" className="gap-1.5 text-[12px] h-8"
              onClick={exportJson} disabled={jobs.length === 0}>
              <Download className="h-3.5 w-3.5" /> JSON
            </Button>
          </div>
          {jobs.length === 0 && (
            <p className="text-[11px] text-stone/70">Add jobs to your workspace to enable export.</p>
          )}
        </SettingsCard>

        {/* ── 4. Danger Zone ────────────────────────────────────────────── */}
        <SettingsCard
          icon={<AlertTriangle className="h-4 w-4" />}
          title="Danger Zone"
          description="Permanently clear all jobs and preferences from this browser."
          danger
        >
          <Button variant="destructive" size="sm" className="gap-1.5 text-[12px] h-8" onClick={onClearWorkspace}>
            <Trash2 className="h-3.5 w-3.5" /> Clear workspace & re-onboard
          </Button>
        </SettingsCard>

      </div>
    </div>
  )
}

// ── Sub-components ─────────────────────────────────────────────────────────────

function SettingsCard({
  icon, title, description, danger, children,
}: {
  icon: React.ReactNode
  title: string
  description?: string
  danger?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={cn(
      "rounded-lg border bg-card overflow-hidden",
      danger ? "border-red-100" : "border-line",
    )}>
      <div className={cn(
        "flex items-center gap-3 px-5 py-3.5 border-b",
        danger ? "border-red-100 bg-red-50/30" : "border-line/60 bg-paper-2/30",
      )}>
        <span className={cn(
          "h-7 w-7 rounded-md flex items-center justify-center shrink-0",
          danger ? "bg-red-100 text-red-500" : "bg-paper-2 text-stone",
        )}>
          {icon}
        </span>
        <div>
          <h3 className={cn("text-[13px] font-bold", danger ? "text-red-600" : "text-ink")}>{title}</h3>
          {description && <p className="text-[11px] text-stone mt-0.5">{description}</p>}
        </div>
      </div>
      <div className="px-5 py-4 space-y-4">{children}</div>
    </div>
  )
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[11px] font-semibold text-stone uppercase tracking-wide">{label}</Label>
      {children}
    </div>
  )
}

function SaveButton({ saved, onClick, label }: { saved: boolean; onClick: () => void; label: string }) {
  return (
    <Button size="sm" className={cn(
      "gap-1.5 text-[12px] h-8 transition-all",
      saved ? "bg-pine-mid hover:bg-pine-mid text-white" : "bg-brand-600 hover:bg-brand-700 text-white",
    )} onClick={onClick}>
      {saved ? <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</> : <><Save className="h-3.5 w-3.5" /> {label}</>}
    </Button>
  )
}

function today() { return new Date().toISOString().slice(0, 10) }

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url; a.download = filename
  document.body.appendChild(a); a.click()
  setTimeout(() => { document.body.removeChild(a); URL.revokeObjectURL(url) }, 100)
}
