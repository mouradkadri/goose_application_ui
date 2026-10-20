"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  ArrowRight, Upload, CheckCircle2, Loader2,
  FileText, XCircle,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useJobSearchStream, LocationPrefs } from "@/lib/use-job-search-stream"
import { resumeStore } from "@/lib/resume-store"
import { session as sessionStore } from "@/lib/session"
import { cn } from "@/lib/utils"

// ── Types ─────────────────────────────────────────────────────────────────────

type WorkStyle = "Remote" | "Hybrid" | "On-site" | "Open to all"
type Seniority = "Junior" | "Mid-level" | "Senior" | "Lead" | "Any"

interface LocationOption {
  label: string
  country_code: string | null
  remote: boolean
}

interface Prefs {
  role: string
  location: string
  country_code: string | null
  is_remote: boolean
  workStyle: WorkStyle
  seniority: Seniority
  resumeText: string
}

// ── Step indicator ─────────────────────────────────────────────────────────────

function StepDots({ current, total }: { current: number; total: number }) {
  return (
    <div className="flex items-center gap-2 mb-8">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className={cn(
            "rounded-full transition-all duration-300",
            i < current
              ? "h-1.5 w-4 bg-brand-500"
              : i === current
              ? "h-1.5 w-4 bg-brand-400"
              : "h-1.5 w-4 bg-line",
          )}
        />
      ))}
    </div>
  )
}

// ── Shared card wrapper ────────────────────────────────────────────────────────

function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <div
      className={cn(
        "bg-card rounded-lg shadow border border-line",
        "w-full max-w-xl mx-auto px-8 py-10 flex flex-col",
        className,
      )}
    >
      {children}
    </div>
  )
}

// ── Step 1 · Welcome ──────────────────────────────────────────────────────────

function WelcomeStep({ onNext }: { onNext: () => void }) {
  return (
    <Card>
      <div className="flex flex-col gap-6">
        <div>
          <p className="fg-label text-brand-600 mb-3">Setup · 2 minutes</p>
          <h1 className="text-[22px] font-bold tracking-tight text-ink leading-snug">
            Your job search,<br />in one workspace.
          </h1>
          <p className="text-[14px] text-stone mt-3 leading-relaxed">
            Upload your resume once. GooseJobs finds matching roles, ranks them against your profile, and helps you apply with tailored documents.
          </p>
        </div>

        <ul className="space-y-2.5 border-t border-line pt-5">
          {[
            "Scans job boards and ranks results against your actual resume",
            "Generates tailored cover letters and resumes for each role",
            "Tracks every application from saved → applied → offer",
          ].map((item) => (
            <li key={item} className="flex items-start gap-2.5 text-[13px] text-stone">
              <span className="text-brand-500 shrink-0 mt-0.5 font-bold">—</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>

        <Button
          onClick={onNext}
          className="w-full h-10 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-semibold gap-2 transition-colors"
        >
          Get started <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

// ── Step 2 · Upload resume ────────────────────────────────────────────────────

function UploadStep({
  onNext,
  onFileSelected,
}: {
  onNext: (file: File) => void
  onFileSelected: (file: File) => void
}) {
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleFile = useCallback((f: File) => {
    if (f.type !== "application/pdf") return
    setFile(f)
    onFileSelected(f)
  }, [onFileSelected])

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }

  return (
    <Card>
      <StepDots current={1} total={4} />
      <h2 className="text-xl font-bold tracking-tight text-ink mb-1">Upload your resume</h2>
      <p className="text-[13px] text-stone mb-6">
        We&apos;ll use it to find and rank the best matching positions for you.
      </p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "border-2 border-dashed rounded-lg p-10 flex flex-col items-center gap-3 cursor-pointer",
          "transition-colors duration-200",
          dragging
            ? "border-brand-400 bg-brand-50/60"
            : file
            ? "border-emerald-300 bg-emerald-50/40"
            : "border-line bg-paper-2/60 hover:border-brand-300 hover:bg-brand-50/30",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) handleFile(f)
          }}
        />

        {file ? (
          <>
            <div className="h-10 w-10 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-[550] text-ink">{file.name}</p>
              <p className="text-[12px] text-stone mt-0.5">
                {(file.size / 1024).toFixed(0)} KB · Click to replace
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="h-10 w-10 rounded-md bg-paper-2 border border-line flex items-center justify-center">
              <Upload className="h-5 w-5 text-stone" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-[550] text-ink-soft">
                Drop your PDF here, or <span className="text-brand-600">browse</span>
              </p>
              <p className="text-[12px] text-stone mt-0.5">PDF only · Max 10 MB</p>
            </div>
          </>
        )}
      </div>

      <Button
        onClick={() => file && onNext(file)}
        disabled={!file}
        className="w-full h-10 mt-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-md font-semibold gap-2 transition-colors"
      >
        Continue <ArrowRight className="h-4 w-4" />
      </Button>
    </Card>
  )
}

// ── Step 3 · Q&A ──────────────────────────────────────────────────────────────

const WORK_STYLES: WorkStyle[] = ["Remote", "Hybrid", "On-site", "Open to all"]
const SENIORITIES: Seniority[] = ["Junior", "Mid-level", "Senior", "Lead", "Any"]

function QAStep({
  onNext,
  prefs,
  onChange,
}: {
  onNext: () => void
  prefs: Prefs
  onChange: (p: Partial<Prefs>) => void
}) {
  const valid = prefs.role.trim().length > 0
  const [availableLocations, setAvailableLocations] = useState<LocationOption[]>([])

  useEffect(() => {
    fetch("/api/supported-locations")
      .then(r => r.ok ? r.json() as Promise<LocationOption[]> : Promise.resolve([]))
      .then(locs => {
        setAvailableLocations(locs)
        // Pre-select first option if nothing is chosen yet
        if (!prefs.country_code && !prefs.is_remote && locs.length > 0) {
          const first = locs[0]
          onChange({
            location: first.label,
            country_code: first.country_code,
            is_remote: first.remote,
          })
        }
      })
      .catch(() => {})
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <Card>
      <StepDots current={2} total={4} />
      <h2 className="text-xl font-bold tracking-tight text-ink mb-1">Tell us what you&apos;re after</h2>
      <p className="text-[13px] text-stone mb-6">Four quick questions to calibrate your search.</p>

      <div className="space-y-5 border-t border-line pt-5">
        {/* Target role */}
        <div className="space-y-1.5">
          <label className="fg-label block text-stone">Target role</label>
          <input
            type="text"
            value={prefs.role}
            placeholder="e.g. Software Engineer, Data Scientist"
            onChange={(e) => onChange({ role: e.target.value })}
            className={cn(
              "w-full h-9 px-3 rounded-md border bg-card text-[13px] outline-none",
              "transition-colors placeholder:text-stone/40",
              "focus:border-brand-400",
              "border-line",
            )}
          />
        </div>

        {/* Location */}
        <div className="space-y-1.5">
          <label className="fg-label block text-stone">Location</label>
          {availableLocations.length > 0 ? (
            <select
              value={prefs.country_code ?? (prefs.is_remote ? 'remote' : '')}
              onChange={e => {
                const opt = availableLocations.find(
                  l => (l.country_code ?? 'remote') === e.target.value
                )
                if (opt) onChange({ location: opt.label, country_code: opt.country_code, is_remote: opt.remote })
              }}
              className={cn(
                "w-full h-9 px-3 rounded-md border bg-card text-[13px] outline-none cursor-pointer",
                "transition-colors focus:border-brand-400 border-line",
              )}
            >
              {availableLocations.map(l => (
                <option key={l.country_code ?? 'remote'} value={l.country_code ?? 'remote'}>
                  {l.label}
                </option>
              ))}
            </select>
          ) : (
            <input
              type="text"
              value={prefs.location}
              placeholder="e.g. United States, Germany, Remote"
              onChange={(e) => onChange({ location: e.target.value })}
              className={cn(
                "w-full h-9 px-3 rounded-md border bg-card text-[13px] outline-none",
                "transition-colors placeholder:text-stone/40",
                "focus:border-brand-400 border-line",
              )}
            />
          )}
        </div>

        {/* Work style */}
        <div className="space-y-1.5">
          <label className="fg-label block text-stone">Work style</label>
          <div className="flex flex-wrap gap-1.5">
            {WORK_STYLES.map((ws) => (
              <button
                key={ws}
                onClick={() => onChange({ workStyle: ws })}
                className={cn(
                  "h-7 px-3 rounded-md text-[12px] font-medium border transition-colors",
                  prefs.workStyle === ws
                    ? "bg-ink text-paper border-ink"
                    : "bg-card text-ink-soft border-line hover:border-ink-soft",
                )}
              >
                {ws}
              </button>
            ))}
          </div>
        </div>

        {/* Seniority */}
        <div className="space-y-1.5">
          <label className="fg-label block text-stone">Seniority</label>
          <div className="flex flex-wrap gap-1.5">
            {SENIORITIES.map((s) => (
              <button
                key={s}
                onClick={() => onChange({ seniority: s })}
                className={cn(
                  "h-7 px-3 rounded-md text-[12px] font-medium border transition-colors",
                  prefs.seniority === s
                    ? "bg-ink text-paper border-ink"
                    : "bg-card text-ink-soft border-line hover:border-ink-soft",
                )}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
      </div>

      <Button
        onClick={onNext}
        disabled={!valid}
        className="w-full h-10 mt-6 bg-brand-600 hover:bg-brand-700 disabled:opacity-40 text-white rounded-md font-semibold gap-2 transition-colors"
      >
        Find my jobs <ArrowRight className="h-4 w-4" />
      </Button>
    </Card>
  )
}

// ── Step 4 · Loading (SSE streaming, unified goose loader) ───────────────────

function LoadingStep({
  resumeFile,
  prefs,
  onComplete,
}: {
  resumeFile: File
  prefs: Prefs
  onComplete: (jobCount: number, jobs: unknown[]) => void
}) {
  const [logs,     setLogs]     = useState<string[]>([])
  const [error,    setError]    = useState<string | null>(null)
  const [jobCount, setJobCount] = useState<number | null>(null)
  const ranRef = useRef(false)

  const { startStream } = useJobSearchStream()

  useEffect(() => {
    if (ranRef.current) return
    ranRef.current = true

    const locationPrefs: LocationPrefs | null = prefs.is_remote
      ? { label: "Remote", country_code: "US", remote: true }
      : prefs.country_code
      ? { label: prefs.location, country_code: prefs.country_code, remote: false }
      : null

    // Store resume text so workspace AI features work without re-uploading
    const fd = new FormData()
    fd.append('resume_file', resumeFile)
    fetch('/api/resume', { method: 'POST', body: fd })
      .then(r => r.ok ? r.json() : null)
      .then(d => {
        if (d?.resume_text) resumeStore.add(resumeFile.name, d.resume_text)
        if (d?.session_id) sessionStore.setId(d.session_id)
      })
      .catch(() => {})

    startStream(resumeFile, locationPrefs, {
      onStep: (msg) => setLogs((prev) => [...prev, msg]),
      onDone: (rawJobs, count) => {
        setJobCount(count)
        onComplete(count, rawJobs)
      },
      onError: (msg) => setError(msg),
    })
  }, [resumeFile, prefs, onComplete, startStream])

  const logBottomRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    logBottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [logs])

  const isFinished = jobCount !== null
  const hasError   = error !== null
  const isRunning  = !isFinished && !hasError

  return (
    <Card>
      <StepDots current={3} total={4} />

      <div className="flex flex-col items-center gap-6">
        {/* Visual */}
        <div className="relative">
          {hasError ? (
            <div className="h-12 w-12 rounded-md bg-red-50 border border-red-200 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-500" />
            </div>
          ) : isFinished ? (
            <div className="h-12 w-12 rounded-md bg-emerald-50 border border-emerald-200 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/goose.gif" alt="Hunting for your best matches…" width={88} height={88} className="rounded-md" />
          )}
        </div>

        {/* Heading */}
        <div className="text-center">
          {hasError ? (
            <>
              <p className="text-[15px] font-semibold text-ink">Search failed</p>
              <p className="text-[13px] text-stone mt-1 max-w-xs">{error}</p>
            </>
          ) : isFinished ? (
            <>
              <p className="text-[15px] font-semibold text-ink">
                Found {jobCount} matching {jobCount === 1 ? "job" : "jobs"}
              </p>
              <p className="text-[13px] text-stone mt-1">Tailored to your resume and preferences.</p>
            </>
          ) : (
            <>
              <p className="text-[15px] font-semibold text-ink">Hunting for your best matches</p>
              <p className="text-[13px] text-stone mt-1">This usually takes 1–2 minutes.</p>
            </>
          )}
        </div>

        {/* SSE log list */}
        <div
          role="log"
          aria-live="polite"
          className="w-full max-h-44 overflow-y-auto rounded-lg bg-paper-2 border border-line p-3 space-y-1.5"
        >
          {logs.length === 0 && (
            <div className="flex items-center gap-2.5 text-[13px] text-stone">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-brand-400" />
              <span>Starting up…</span>
            </div>
          )}
          {logs.map((log, i) => {
            const isLast = i === logs.length - 1 && isRunning
            return (
              <div key={i} className={cn("flex items-start gap-2.5 text-[13px] animate-in fade-in duration-200")}>
                {isLast ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-brand-500 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
                )}
                <span className={cn("leading-snug", isLast ? "text-ink-soft font-medium" : "text-stone")}>{log}</span>
              </div>
            )
          })}
          <div ref={logBottomRef} />
        </div>

        {hasError && (
          <Button variant="outline" onClick={() => window.location.reload()} className="rounded-lg h-9 text-[13px]">
            Try again
          </Button>
        )}
      </div>
    </Card>
  )
}

// ── Step 5 · Success ──────────────────────────────────────────────────────────

function SuccessStep({ jobCount, onEnter }: { jobCount: number; onEnter: () => void }) {
  return (
    <Card>
      <div className="flex flex-col gap-5">
        <div>
          <p className="fg-label text-pine-mid mb-3">Search complete</p>
          <p className="text-[22px] font-bold tracking-tight text-ink">
            {jobCount} {jobCount === 1 ? "match" : "matches"} found
          </p>
          <p className="text-[14px] text-stone mt-2 leading-relaxed">
            Ranked by fit against your resume. Open each job to generate a tailored cover letter or resume.
          </p>
        </div>

        <Button
          onClick={onEnter}
          className="w-full h-10 bg-brand-600 hover:bg-brand-700 text-white rounded-md font-semibold gap-2 transition-colors"
        >
          Open workspace <ArrowRight className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  )
}

// ── Main onboarding page ───────────────────────────────────────────────────────

type Step = 1 | 2 | 3 | 4 | 5

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [prefs, setPrefs] = useState<Prefs>({
    role: "",
    location: "",
    country_code: null,
    is_remote: false,
    workStyle: "Open to all",
    seniority: "Any",
    resumeText: "",
  })
  const [foundJobs, setFoundJobs] = useState<unknown[]>([])
  const [jobCount, setJobCount] = useState(0)

  // Redirect if already onboarded
  useEffect(() => {
    if (typeof window !== "undefined" && localStorage.getItem("gj_onboarded")) {
      window.location.href = "/workspace"
    }
  }, [])

  const updatePrefs = (p: Partial<Prefs>) => setPrefs((prev) => ({ ...prev, ...p }))

  const handleSearchComplete = useCallback((count: number, jobs: unknown[]) => {
    setJobCount(count)
    setFoundJobs(jobs)
    // Delay 800 ms then advance to success step so user sees the terminal settle
    setTimeout(() => setStep(5), 800)
  }, [])

  const handleEnterWorkspace = () => {
    // Store prefs + signal completion
    localStorage.setItem("gj_onboarded", JSON.stringify(prefs))
    // Store jobs in localStorage for the main workspace to pick up
    if (foundJobs.length > 0) {
      localStorage.setItem("gj_onboarding_jobs", JSON.stringify(foundJobs))
    }
    window.location.href = "/"
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center px-4 py-12"
      style={{
        background: 'radial-gradient(ellipse 120% 60% at 50% 0%, #5c3410 0%, #30190b 40%, #221409 70%, #181009 100%)'
      }}
    >
      {/* Breathing amber glow overlay */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none glow-idle"
        style={{ background: "radial-gradient(70% 45% at 50% 5%, rgba(232,147,58,0.20), transparent 68%)" }}
      />

      <div className="relative z-10 w-full max-w-xl">
        {step === 1 && <WelcomeStep onNext={() => setStep(2)} />}

        {step === 2 && (
          <UploadStep
            onNext={(file) => {
              setResumeFile(file)
              setStep(3)
            }}
            onFileSelected={setResumeFile}
          />
        )}

        {step === 3 && (
          <QAStep
            prefs={prefs}
            onChange={updatePrefs}
            onNext={() => setStep(4)}
          />
        )}

        {step === 4 && resumeFile && (
          <LoadingStep
            resumeFile={resumeFile}
            prefs={prefs}
            onComplete={handleSearchComplete}
          />
        )}

        {step === 5 && (
          <SuccessStep jobCount={jobCount} onEnter={handleEnterWorkspace} />
        )}
      </div>

      {/* Powered-by footer */}
      <p className="relative z-10 mt-8 text-[11px] text-leather-ink-soft tracking-wide">
        GOOSEJOBS · AI-POWERED JOB SEARCH
      </p>
    </div>
  )
}
