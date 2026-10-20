"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { DEMO_JOBS, DEMO_PREFS, DEMO_RESUME_STORE, DEMO_WEEKLY_GOAL } from "@/lib/demo-seed"

function GooseFormation({ className = "" }: { className?: string }) {
  const birds = [
    { x: 60, y: 6, lead: true },
    { x: 48, y: 14 }, { x: 72, y: 14 },
    { x: 37, y: 22 }, { x: 83, y: 22 },
    { x: 27, y: 30 }, { x: 93, y: 30 },
  ]
  return (
    <svg viewBox="0 0 120 40" className={className} fill="none" aria-hidden="true">
      {birds.map((b, i) => (
        <path
          key={i}
          d={`M${b.x - 5} ${b.y + 3} L${b.x} ${b.y} L${b.x + 5} ${b.y + 3}`}
          stroke="var(--amber)"
          strokeWidth={b.lead ? 1.8 : 1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity={b.lead ? 1 : 0.55}
        />
      ))}
    </svg>
  )
}

function EnterForm({ onActiveChange }: { onActiveChange: (v: boolean) => void }) {
  const router = useRouter()
  const params = useSearchParams()
  const from = params.get("from") || "/workspace"
  const isDemoMode = params.get("mode") === "demo"

  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])
  useEffect(() => { onActiveChange(loading) }, [loading, onActiveChange])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/auth?from=${encodeURIComponent(from)}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json() as { ok: boolean; error?: string; redirectTo?: string }
      if (data.ok) {
        if (isDemoMode) {
          localStorage.setItem("gj_onboarded", JSON.stringify(DEMO_PREFS))
          localStorage.setItem("goosejobs_copilot_v1", JSON.stringify(DEMO_JOBS))
          localStorage.setItem("goosejobs_resumes_v1", JSON.stringify(DEMO_RESUME_STORE))
          localStorage.setItem("gj_weekly_goal", DEMO_WEEKLY_GOAL)
          localStorage.setItem("gj_demo_mode", "true")
          localStorage.removeItem("goosejobs_session_id")
          router.replace("/workspace")
        } else {
          router.replace(data.redirectTo || from)
        }
      } else {
        setError(data.error || "That code didn’t work. Check it and try again.")
        setCode("")
        inputRef.current?.focus()
      }
    } catch {
      setError("Something went wrong on our end. Try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[360px] space-y-4">
      <div className="space-y-2">
        <label htmlFor="access-code" className="fg-label block text-leather-ink-soft">
          Access code
        </label>
        <input
          id="access-code"
          ref={inputRef}
          type="text"
          value={code}
          onFocus={() => onActiveChange(true)}
          onBlur={() => onActiveChange(loading)}
          onChange={e => { setCode(e.target.value); setError("") }}
          placeholder={"•••• ••••"}
          autoComplete="off"
          spellCheck={false}
          className={[
            "w-full px-4 py-3 rounded-lg text-[15px] text-center tracking-[0.3em] fg-data",
            "bg-[#0e0c09] border text-leather-ink placeholder:text-leather-ink-faint",
            "outline-none transition-colors focus:ring-0",
            error
              ? "border-clay/70 focus:border-clay"
              : "border-leather-line focus:border-brand-400",
          ].join(" ")}
          disabled={loading}
        />
        {error && <p className="text-[12px] text-clay/90">{error}</p>}
      </div>

      <button
        type="submit"
        disabled={!code.trim() || loading}
        className={[
          "w-full py-3 rounded-lg text-[14px] font-semibold transition-all",
          "bg-amber text-[#13100a] hover:bg-brand-300",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2",
        ].join(" ")}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? "Verifying…" : "Continue"}
      </button>
    </form>
  )
}

export default function EnterPage() {
  const [isActive, setIsActive] = useState(false)

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: "#1e1912" }}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${isActive ? "glow-active" : "glow-idle"}`}
        style={{ background: "radial-gradient(70% 55% at 50% 16%, rgba(232,147,58,0.28), transparent 72%)" }}
      />

      <div className="relative w-full max-w-[360px] flex flex-col items-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/goose_job_logo.png" alt="" width={72} height={72} className="object-contain drop-shadow-lg" />

        <GooseFormation className="w-24 h-8 mt-5" />

        <p className="fg-label mt-5 text-brand-400/90">Private beta</p>
        <h1 className="font-display text-[30px] font-extrabold text-leather-ink mt-2 tracking-tight">
          GooseJobs
        </h1>
        <p className="text-[14px] text-leather-ink-soft mt-2 text-center leading-relaxed text-balance">
          Your whole job hunt in formation &mdash; search, tailor, and track every application in one workspace.
        </p>

        <div className="w-full h-px bg-leather-line my-7" />

        <Suspense fallback={
          <div className="w-full max-w-[360px] flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-leather-ink-soft" />
          </div>
        }>
          <EnterForm onActiveChange={setIsActive} />
        </Suspense>

        <div className="flex items-center gap-3 w-full max-w-[360px] mt-5">
          <div className="flex-1 h-px bg-leather-line opacity-30" />
          <span className="text-[11px] text-leather-ink-faint tracking-wide">or</span>
          <div className="flex-1 h-px bg-leather-line opacity-30" />
        </div>

        <a
          href="/demo"
          className="mt-4 text-[13px] text-leather-ink-soft/70 hover:text-leather-ink-soft transition-colors underline underline-offset-2"
        >
          Don&apos;t have a code? Request demo access &rarr;
        </a>

        <p className="fg-label mt-8 text-leather-ink-faint">GooseJobs &middot; Private beta</p>
      </div>
    </div>
  )
}
