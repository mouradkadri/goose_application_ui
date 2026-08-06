"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import {
  ArrowRight, Upload, CheckCircle2, Loader2, Sparkles,
  FileText, MapPin, Briefcase, Layers, XCircle,
  Target, PenLine, Zap,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useJobSearchStream, LocationPrefs } from "@/lib/use-job-search-stream"
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
              ? "h-1.5 w-4 bg-indigo-500"
              : i === current
              ? "h-1.5 w-4 bg-indigo-400"
              : "h-1.5 w-4 bg-zinc-200",
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
        "bg-white rounded-2xl shadow-[0_4px_32px_rgba(0,0,0,0.07)] border border-zinc-100",
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
      <div className="flex flex-col items-center text-center gap-5">
        <div className="h-16 w-16 rounded-2xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
          <Sparkles className="h-8 w-8 text-white" />
        </div>

        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Welcome to GooseJobs</h1>
          <p className="text-[15px] text-zinc-500 mt-2 leading-relaxed max-w-xs mx-auto">
            Your AI-powered job application copilot. Let&apos;s set up your workspace in under a minute.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 w-full mt-2">
          {[
            { Icon: Target,  label: "Smart matching"   },
            { Icon: PenLine, label: "AI cover letters" },
            { Icon: Zap,     label: "One-click apply"  },
          ].map(({ Icon, label }) => (
            <div
              key={label}
              className="flex flex-col items-center gap-1.5 p-3 rounded-lg bg-zinc-50 border border-zinc-100"
            >
              <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center">
                <Icon className="h-4 w-4 text-indigo-500" aria-hidden />
              </div>
              <span className="text-[12px] font-medium text-zinc-600 text-center">{label}</span>
            </div>
          ))}
        </div>

        <Button
          onClick={onNext}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-[550] tracking-tight gap-2 mt-2 transition-colors"
        >
          Get Started <ArrowRight className="h-4 w-4" />
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
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-1">Upload your resume</h2>
      <p className="text-[13px] text-zinc-500 mb-6">
        We&apos;ll use it to find and rank the best matching positions for you.
      </p>

      {/* Drop zone */}
      <div
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={cn(
          "border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer",
          "transition-colors duration-200",
          dragging
            ? "border-indigo-400 bg-indigo-50/60"
            : file
            ? "border-emerald-300 bg-emerald-50/40"
            : "border-zinc-200 bg-zinc-50/60 hover:border-indigo-300 hover:bg-indigo-50/30",
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
            <div className="h-12 w-12 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-emerald-500" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-[550] text-zinc-800">{file.name}</p>
              <p className="text-[12px] text-zinc-400 mt-0.5">
                {(file.size / 1024).toFixed(0)} KB · Click to replace
              </p>
            </div>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center">
              <Upload className="h-5 w-5 text-zinc-400" />
            </div>
            <div className="text-center">
              <p className="text-[14px] font-[550] text-zinc-700">
                Drop your PDF here, or <span className="text-indigo-600">browse</span>
              </p>
              <p className="text-[12px] text-zinc-400 mt-0.5">PDF only · Max 10 MB</p>
            </div>
          </>
        )}
      </div>

      <Button
        onClick={() => file && onNext(file)}
        disabled={!file}
        className="w-full h-11 mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-[550] tracking-tight gap-2 transition-colors"
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
      <h2 className="text-xl font-bold tracking-tight text-zinc-900 mb-1">Tell us what you&apos;re after</h2>
      <p className="text-[13px] text-zinc-500 mb-6">Four quick questions to calibrate your search.</p>

      <div className="space-y-5">
        {/* Target role */}
        <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/60 space-y-2.5">
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-indigo-500 shrink-0" />
            <span className="text-[13px] font-[550] text-zinc-800">Target role</span>
          </div>
          <input
            type="text"
            value={prefs.role}
            placeholder="e.g. Software Engineer, Data Scientist"
            onChange={(e) => onChange({ role: e.target.value })}
            className={cn(
              "w-full h-9 px-3 rounded-lg border bg-white text-[13px] outline-none",
              "transition-colors placeholder:text-zinc-300",
              "focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100",
              "border-zinc-200",
            )}
          />
        </div>

        {/* Location */}
        <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/60 space-y-2.5">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-indigo-500 shrink-0" />
            <span className="text-[13px] font-[550] text-zinc-800">Where are you looking?</span>
          </div>
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
                "w-full h-9 px-3 rounded-lg border bg-white text-[13px] outline-none cursor-pointer",
                "transition-colors focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 border-zinc-200",
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
                "w-full h-9 px-3 rounded-lg border bg-white text-[13px] outline-none",
                "transition-colors placeholder:text-zinc-300",
                "focus:border-indigo-400 focus:ring-1 focus:ring-indigo-100 border-zinc-200",
              )}
            />
          )}
        </div>

        {/* Work style */}
        <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/60 space-y-2.5">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-indigo-500 shrink-0" />
            <span className="text-[13px] font-[550] text-zinc-800">Work style preference</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {WORK_STYLES.map((ws) => (
              <button
                key={ws}
                onClick={() => onChange({ workStyle: ws })}
                className={cn(
                  "h-8 px-3 rounded-lg text-[12px] font-[500] border transition-colors",
                  prefs.workStyle === ws
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-indigo-300",
                )}
              >
                {ws}
              </button>
            ))}
          </div>
        </div>

        {/* Seniority */}
        <div className="p-4 rounded-xl border border-zinc-100 bg-zinc-50/60 space-y-2.5">
          <div className="flex items-center gap-2">
            <FileText className="h-4 w-4 text-indigo-500 shrink-0" />
            <span className="text-[13px] font-[550] text-zinc-800">Seniority level</span>
          </div>
          <div className="flex flex-wrap gap-2">
            {SENIORITIES.map((s) => (
              <button
                key={s}
                onClick={() => onChange({ seniority: s })}
                className={cn(
                  "h-8 px-3 rounded-lg text-[12px] font-[500] border transition-colors",
                  prefs.seniority === s
                    ? "bg-indigo-600 text-white border-indigo-600"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-indigo-300",
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
        className="w-full h-11 mt-6 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-40 text-white rounded-xl font-[550] tracking-tight gap-2 transition-colors"
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
            <div className="h-14 w-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center">
              <XCircle className="h-7 w-7 text-red-500" />
            </div>
          ) : isFinished ? (
            <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
              <CheckCircle2 className="h-7 w-7 text-emerald-500" />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src="/goose.gif" alt="Hunting for your best matches…" width={88} height={88} className="rounded-xl" />
          )}
        </div>

        {/* Heading */}
        <div className="text-center">
          {hasError ? (
            <>
              <p className="text-[15px] font-semibold text-zinc-900">Search failed</p>
              <p className="text-[13px] text-zinc-500 mt-1 max-w-xs">{error}</p>
            </>
          ) : isFinished ? (
            <>
              <p className="text-[15px] font-semibold text-zinc-900">
                Found {jobCount} matching {jobCount === 1 ? "job" : "jobs"}
              </p>
              <p className="text-[13px] text-zinc-500 mt-1">Tailored to your resume and preferences.</p>
            </>
          ) : (
            <>
              <p className="text-[15px] font-semibold text-zinc-900">Hunting for your best matches</p>
              <p className="text-[13px] text-zinc-500 mt-1">This usually takes 1–2 minutes.</p>
            </>
          )}
        </div>

        {/* SSE log list */}
        <div
          role="log"
          aria-live="polite"
          className="w-full max-h-44 overflow-y-auto rounded-lg bg-zinc-50 border border-zinc-100 p-3 space-y-1.5"
        >
          {logs.length === 0 && (
            <div className="flex items-center gap-2.5 text-[13px] text-zinc-400">
              <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin text-indigo-400" />
              <span>Starting up…</span>
            </div>
          )}
          {logs.map((log, i) => {
            const isLast = i === logs.length - 1 && isRunning
            return (
              <div key={i} className={cn("flex items-start gap-2.5 text-[13px] animate-in fade-in duration-200")}>
                {isLast ? (
                  <Loader2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-indigo-500 animate-spin" />
                ) : (
                  <CheckCircle2 className="h-3.5 w-3.5 shrink-0 mt-0.5 text-emerald-400" />
                )}
                <span className={cn("leading-snug", isLast ? "text-zinc-700 font-medium" : "text-zinc-400")}>{log}</span>
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
      <div className="flex flex-col items-center text-center gap-6">
        <div className="h-16 w-16 rounded-full bg-emerald-50 border-2 border-emerald-100 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-emerald-500" />
        </div>

        <div>
          <p className="text-2xl font-bold tracking-tight text-zinc-900">
            {jobCount} {jobCount === 1 ? "match" : "matches"} found!
          </p>
          <p className="text-[14px] text-zinc-500 mt-2 max-w-xs mx-auto leading-relaxed">
            Your AI copilot has found and ranked {jobCount} positions matching your resume.
            Let&apos;s start applying.
          </p>
        </div>

        <Button
          onClick={onEnter}
          className="w-full h-11 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-[550] tracking-tight gap-2 transition-colors"
        >
          Enter Workspace <ArrowRight className="h-4 w-4" />
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
      window.location.href = "/"
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
        background: "radial-gradient(ellipse 80% 60% at 50% 0%, #eef2ff 0%, #f8fafc 60%, #ffffff 100%)",
      }}
    >
      {/* Subtle grid texture */}
      <div
        className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{
          backgroundImage:
            "linear-gradient(#6366f1 1px, transparent 1px), linear-gradient(to right, #6366f1 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
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
      <p className="relative z-10 mt-8 text-[11px] text-zinc-300 tracking-wide">
        GOOSEJOBS · AI-POWERED JOB SEARCH
      </p>
    </div>
  )
}
