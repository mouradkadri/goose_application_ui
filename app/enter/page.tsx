"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

/** Signature: a small V-formation of geese — the migration/"in formation" motif. */
function GooseFormation({ className = "" }: { className?: string }) {
  // Lead bird at top-center, wings trailing down both sides.
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

function EnterForm() {
  const router = useRouter()
  const params = useSearchParams()
  const from = params.get('from') || '/'

  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!code.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/auth?from=${encodeURIComponent(from)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() }),
      })
      const data = await res.json() as { ok: boolean; error?: string; redirectTo?: string }
      if (data.ok) {
        router.replace(data.redirectTo || from)
      } else {
        setError(data.error || 'That code didn’t work. Check it and try again.')
        setCode('')
        inputRef.current?.focus()
      }
    } catch {
      setError('Something went wrong on our end. Try again.')
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
          onChange={e => { setCode(e.target.value); setError('') }}
          placeholder="•••• ••••"
          autoComplete="off"
          spellCheck={false}
          className={[
            "w-full px-4 py-3 rounded-lg text-[15px] text-center tracking-[0.3em] fg-data",
            "bg-[#0e0c09] border text-leather-ink placeholder:text-leather-ink-faint",
            "outline-none transition-colors focus:ring-0",
            error
              ? "border-clay/70 focus:border-clay"
              : "border-leather-line focus:border-brand-400",
          ].join(' ')}
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
        ].join(' ')}
      >
        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        {loading ? 'Verifying…' : 'Continue'}
      </button>
    </form>
  )
}

export default function EnterPage() {
  return (
    <div className="min-h-screen bg-leather flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* warm ambient glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{ background: "radial-gradient(60% 50% at 50% 18%, rgba(232,147,58,0.10), transparent 70%)" }}
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
          Your whole job hunt in formation — search, tailor, and track every application in one workspace.
        </p>

        <div className="w-full h-px bg-leather-line my-7" />

        <Suspense fallback={
          <div className="w-full max-w-[360px] flex items-center justify-center py-10">
            <Loader2 className="h-5 w-5 animate-spin text-leather-ink-soft" />
          </div>
        }>
          <EnterForm />
        </Suspense>

        <p className="fg-label mt-8 text-leather-ink-faint">GooseJobs · Private beta</p>
      </div>
    </div>
  )
}
