"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2, CheckCircle2 } from "lucide-react"
import Image from "next/image"
import Link from "next/link"

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

function RegisterForm({ onActiveChange }: { onActiveChange: (v: boolean) => void }) {
  const router = useRouter()
  const params = useSearchParams()
  const from = params.get('from') || '/onboarding'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const emailRef = useRef<HTMLInputElement>(null)

  useEffect(() => { emailRef.current?.focus() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim() || !password || !confirm) return
    if (password !== confirm) { setError('Passwords do not match.'); return }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return }

    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/auth-backend/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
        credentials: 'include',
      })
      const data = await res.json() as { ok?: boolean; detail?: string }
      if (res.ok && data.ok) {
        router.replace(from)
      } else {
        setError(data.detail || 'Registration failed. Please try again.')
      }
    } catch {
      setError('Network error — please try again.')
    } finally {
      setLoading(false)
    }
  }

  const inputCls = [
    "w-full px-4 py-3 rounded-lg text-[14px] fg-data",
    "bg-[#0e0c09] border text-leather-ink placeholder:text-leather-ink-faint",
    "outline-none transition-colors focus:ring-0 border-leather-line focus:border-brand-400",
  ].join(' ')

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-[360px] space-y-3">
      <div className="space-y-1.5">
        <label className="fg-label block text-leather-ink-soft/80">Email</label>
        <input
          ref={emailRef}
          type="email"
          value={email}
          onChange={e => { setEmail(e.target.value); setError('') }}
          onFocus={() => onActiveChange(true)}
          onBlur={() => onActiveChange(loading)}
          placeholder="you@example.com"
          autoComplete="email"
          className={inputCls}
          disabled={loading}
        />
      </div>
      <div className="space-y-1.5">
        <label className="fg-label block text-leather-ink-soft/80">Password</label>
        <input
          type="password"
          value={password}
          onChange={e => { setPassword(e.target.value); setError('') }}
          onFocus={() => onActiveChange(true)}
          onBlur={() => onActiveChange(loading)}
          placeholder="At least 8 characters"
          autoComplete="new-password"
          className={inputCls}
          disabled={loading}
        />
      </div>
      <div className="space-y-1.5">
        <label className="fg-label block text-leather-ink-soft/80">Confirm password</label>
        <input
          type="password"
          value={confirm}
          onChange={e => { setConfirm(e.target.value); setError('') }}
          onFocus={() => onActiveChange(true)}
          onBlur={() => onActiveChange(loading)}
          placeholder="••••••••"
          autoComplete="new-password"
          className={inputCls}
          disabled={loading}
        />
      </div>

      {error && <p className="text-[12px] text-clay/90">{error}</p>}

      <button
        type="submit"
        disabled={!email.trim() || !password || !confirm || loading}
        className={[
          "w-full py-3 rounded-lg text-[14px] font-semibold transition-all mt-1",
          "bg-amber text-[#13100a] hover:bg-brand-300",
          "disabled:opacity-40 disabled:cursor-not-allowed",
          "flex items-center justify-center gap-2",
        ].join(' ')}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {loading ? 'Creating account…' : 'Create account'}
      </button>

      <p className="text-[11px] text-leather-ink-faint text-center leading-relaxed">
        By creating an account you agree to our terms of service and privacy policy.
      </p>
    </form>
  )
}

export default function RegisterPage() {
  const [isActive, setIsActive] = useState(false)

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

      <div className="relative w-full max-w-[360px] flex flex-col items-center">
        <Image src="/goose_job_logo.png" alt="" width={64} height={64} className="object-contain drop-shadow-lg" />
        <GooseFormation className="w-24 h-8 mt-5" />

        <p className="fg-label mt-5 text-brand-400/90">Get started</p>
        <h1 className="font-display text-[28px] font-extrabold text-leather-ink mt-2 tracking-tight">
          Create account
        </h1>
        <p className="text-[13px] text-leather-ink-soft/60 mt-2 text-center">
          Free to start — no credit card required.
        </p>

        <div className="w-full h-px bg-leather-line my-6 opacity-40" />

        <Suspense fallback={<Loader2 className="h-5 w-5 animate-spin text-leather-ink-soft" />}>
          <RegisterForm onActiveChange={setIsActive} />
        </Suspense>

        <div className="flex items-center gap-3 w-full max-w-[360px] mt-5">
          <div className="flex-1 h-px bg-leather-line opacity-30" />
          <span className="text-[11px] text-leather-ink-faint tracking-wide">or sign up with</span>
          <div className="flex-1 h-px bg-leather-line opacity-30" />
        </div>

        <div className="flex flex-col gap-2.5 w-full max-w-[360px] mt-3">
          <a
            href="/api/oauth/google"
            className="flex items-center justify-center gap-3 w-full py-2.5 rounded-lg border border-leather-line bg-[#0e0c09] hover:bg-[#161210] transition-colors text-[13px] font-medium text-leather-ink"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.716v2.259h2.908c1.702-1.567 2.684-3.875 2.684-6.615z" fill="#4285F4"/>
              <path d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
              <path d="M3.964 10.706A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.706V4.962H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.038l3.007-2.332z" fill="#FBBC05"/>
              <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.962L3.964 7.294C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
            </svg>
            Sign up with Google
          </a>

          <a
            href="/api/oauth/linkedin"
            className="flex items-center justify-center gap-3 w-full py-2.5 rounded-lg border border-leather-line bg-[#0e0c09] hover:bg-[#161210] transition-colors text-[13px] font-medium text-leather-ink"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
              <rect width="18" height="18" rx="3" fill="#0A66C2"/>
              <path d="M4.5 7H6.5V13.5H4.5V7ZM5.5 6C4.95 6 4.5 5.55 4.5 5C4.5 4.45 4.95 4 5.5 4C6.05 4 6.5 4.45 6.5 5C6.5 5.55 6.05 6 5.5 6Z" fill="white"/>
              <path d="M8 7H9.9V8C10.2 7.45 11 7 12 7C13.9 7 14.5 8.1 14.5 9.8V13.5H12.5V10C12.5 9.2 12.2 8.7 11.5 8.7C10.75 8.7 10 9.2 10 10.1V13.5H8V7Z" fill="white"/>
            </svg>
            Sign up with LinkedIn
          </a>
        </div>

        <Link
          href="/login"
          className="mt-5 text-[13px] text-leather-ink-soft/70 hover:text-leather-ink-soft transition-colors"
        >
          Already have an account? Sign in →
        </Link>

        <p className="fg-label mt-8 text-leather-ink-faint">GooseJobs · Private beta</p>
      </div>
    </div>
  )
}
