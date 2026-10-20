"use client"

import { useState, useRef, useEffect } from "react"
import { Loader2, CheckCircle2, ArrowRight } from "lucide-react"
import Image from "next/image"

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

export default function DemoRequestPage() {
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [error, setError] = useState('')
  const [isActive, setIsActive] = useState(false)
  const nameRef = useRef<HTMLInputElement>(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim() || !email.trim()) return
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/request-demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim(), email: email.trim(), message: message.trim() }),
      })
      const data = await res.json() as { ok: boolean; error?: string }
      if (data.ok) {
        setSubmitted(true)
      } else {
        setError(data.error || 'Something went wrong. Try again.')
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden"
      style={{ backgroundColor: '#1e1912' }}
    >
      <div
        aria-hidden
        className={`pointer-events-none absolute inset-0 ${isActive ? 'glow-active' : 'glow-idle'}`}
        style={{ background: "radial-gradient(70% 55% at 50% 16%, rgba(232,147,58,0.28), transparent 72%)" }}
      />

      <div className="relative w-full max-w-[380px] flex flex-col items-center">
        <Image src="/goose_job_logo.png" alt="" width={64} height={64} className="object-contain drop-shadow-lg" />
        <GooseFormation className="w-24 h-8 mt-5" />

        {submitted ? (
          <div className="mt-7 flex flex-col items-center text-center gap-3">
            <div className="h-12 w-12 rounded-full bg-brand-600/20 border border-brand-400/30 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-brand-400" />
            </div>
            <h1 className="font-display text-[26px] font-extrabold text-leather-ink tracking-tight">
              Request sent.
            </h1>
            <p className="text-[14px] text-leather-ink-soft/80 leading-relaxed max-w-[300px]">
              Keep an eye on your inbox — we&apos;ll email you an access code within 24 hours.
            </p>
            <div className="w-full h-px bg-leather-line opacity-30 my-4" />
            <p className="text-[13px] text-leather-ink-soft/60">Already have a code?</p>
            <a
              href="/enter"
              className="flex items-center gap-1.5 text-[13px] text-brand-400 hover:text-brand-300 transition-colors font-medium"
            >
              Enter it here <ArrowRight className="h-3.5 w-3.5" />
            </a>
          </div>
        ) : (
          <>
            <p className="fg-label mt-5 text-brand-400/90">Demo access</p>
            <h1 className="font-display text-[28px] font-extrabold text-leather-ink mt-2 tracking-tight text-center">
              Request a demo
            </h1>
            <p className="text-[13px] text-leather-ink-soft/70 mt-2 text-center leading-relaxed max-w-[300px]">
              A pre-loaded workspace with 15 ranked jobs, AI-generated documents, and a full application pipeline.
            </p>

            <div className="w-full h-px bg-leather-line opacity-30 my-6" />

            <form onSubmit={handleSubmit} className="w-full space-y-3">
              <div className="space-y-1.5">
                <label className="fg-label block text-leather-ink-soft/80">Your name</label>
                <input
                  ref={nameRef}
                  type="text"
                  value={name}
                  onChange={e => { setName(e.target.value); setError('') }}
                  onFocus={() => setIsActive(true)}
                  onBlur={() => setIsActive(false)}
                  placeholder="Alex Chen"
                  autoComplete="name"
                  className={[
                    "w-full px-4 py-3 rounded-lg text-[14px] fg-data",
                    "bg-[#0e0c09] border text-leather-ink placeholder:text-leather-ink-faint",
                    "outline-none transition-colors focus:ring-0",
                    "border-leather-line focus:border-brand-400",
                  ].join(' ')}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="fg-label block text-leather-ink-soft/80">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => { setEmail(e.target.value); setError('') }}
                  onFocus={() => setIsActive(true)}
                  onBlur={() => setIsActive(false)}
                  placeholder="you@example.com"
                  autoComplete="email"
                  className={[
                    "w-full px-4 py-3 rounded-lg text-[14px] fg-data",
                    "bg-[#0e0c09] border text-leather-ink placeholder:text-leather-ink-faint",
                    "outline-none transition-colors focus:ring-0",
                    "border-leather-line focus:border-brand-400",
                  ].join(' ')}
                  disabled={loading}
                />
              </div>

              <div className="space-y-1.5">
                <label className="fg-label block text-leather-ink-soft/80">
                  What are you building or exploring?
                  <span className="text-leather-ink-faint ml-1">(optional)</span>
                </label>
                <textarea
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                  onFocus={() => setIsActive(true)}
                  onBlur={() => setIsActive(false)}
                  placeholder="Job searching, recruiter tool, research..."
                  rows={2}
                  className={[
                    "w-full px-4 py-3 rounded-lg text-[14px] fg-data resize-none",
                    "bg-[#0e0c09] border text-leather-ink placeholder:text-leather-ink-faint",
                    "outline-none transition-colors focus:ring-0",
                    "border-leather-line focus:border-brand-400",
                  ].join(' ')}
                  disabled={loading}
                />
              </div>

              {error && <p className="text-[12px] text-clay/90">{error}</p>}

              <button
                type="submit"
                disabled={!name.trim() || !email.trim() || loading}
                className={[
                  "w-full py-3 rounded-lg text-[14px] font-semibold transition-all mt-1",
                  "bg-amber text-[#13100a] hover:bg-brand-300",
                  "disabled:opacity-40 disabled:cursor-not-allowed",
                  "flex items-center justify-center gap-2",
                ].join(' ')}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? 'Sending…' : 'Request access →'}
              </button>
            </form>

            <div className="flex items-center gap-3 w-full mt-5">
              <div className="flex-1 h-px bg-leather-line opacity-30" />
              <span className="text-[11px] text-leather-ink-faint tracking-wide">or</span>
              <div className="flex-1 h-px bg-leather-line opacity-30" />
            </div>

            <a
              href="/enter"
              className="mt-4 text-[13px] text-leather-ink-soft/70 hover:text-leather-ink-soft transition-colors"
            >
              Already have an access code →
            </a>
          </>
        )}

        <p className="fg-label mt-10 text-leather-ink-faint">GooseJobs · Private beta</p>
      </div>
    </div>
  )
}
