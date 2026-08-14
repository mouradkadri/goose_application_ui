"use client"

import { useState, useRef, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"

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
        setError(data.error || 'Invalid code')
        setCode('')
        inputRef.current?.focus()
      }
    } catch {
      setError('Something went wrong. Try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="w-full max-w-sm bg-[#1a1510] border border-[#2a2018] rounded-2xl p-8 space-y-5 shadow-xl"
    >
      <div className="text-center space-y-1">
        <h2 className="text-[15px] font-semibold text-[#f2e4cf]">Enter access code</h2>
        <p className="text-[12px] text-[#9a8570] leading-relaxed">
          This app is in private beta. Enter your access code to continue.
        </p>
      </div>

      <div className="space-y-3">
        <input
          ref={inputRef}
          type="text"
          value={code}
          onChange={e => { setCode(e.target.value); setError('') }}
          placeholder="Access code"
          autoComplete="off"
          spellCheck={false}
          className={[
            "w-full px-4 py-3 rounded-xl text-[14px] text-center tracking-widest font-mono",
            "bg-[#0e0c09] border text-[#f2e4cf] placeholder:text-[#4a3f32] placeholder:tracking-normal placeholder:font-sans",
            "outline-none transition-colors",
            error
              ? "border-red-500/60 focus:border-red-400"
              : "border-[#2a2018] focus:border-amber-500/60",
          ].join(' ')}
          disabled={loading}
        />
        {error && (
          <p className="text-[12px] text-red-400 text-center">{error}</p>
        )}
      </div>

      <button
        type="submit"
        disabled={!code.trim() || loading}
        className={[
          "w-full py-3 rounded-xl text-[14px] font-semibold transition-all",
          "bg-amber-500 hover:bg-amber-400 text-[#0e0c09]",
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
    <div className="min-h-screen bg-[#13100a] flex flex-col items-center justify-center p-6">
      {/* Goose logo */}
      <div className="mb-8 flex flex-col items-center gap-3">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/goose_job_logo.png" alt="GooseJobs" width={90} height={90} className="object-contain drop-shadow-lg" />
        <div className="text-center">
          <h1 className="text-[22px] font-bold text-[#f2e4cf] tracking-tight">GooseJobs</h1>
          <p className="text-[13px] text-[#9a8570] mt-1">AI-powered job copilot</p>
        </div>
      </div>

      <Suspense fallback={
        <div className="w-full max-w-sm bg-[#1a1510] border border-[#2a2018] rounded-2xl p-8 flex items-center justify-center">
          <Loader2 className="h-5 w-5 animate-spin text-[#9a8570]" />
        </div>
      }>
        <EnterForm />
      </Suspense>

      <p className="mt-6 text-[11px] text-[#4a3f32]">
        GooseJobs · Private Beta
      </p>
    </div>
  )
}
