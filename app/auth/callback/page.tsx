"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Loader2 } from "lucide-react"
import { Suspense } from "react"

function CallbackInner() {
  const router = useRouter()
  const params = useSearchParams()
  const [status, setStatus] = useState<"loading" | "error">("loading")

  useEffect(() => {
    const ott = params.get("ott")
    const dest = params.get("dest") || "/workspace"

    if (!ott) {
      router.replace("/login?error=oauth_failed")
      return
    }

    fetch(`/api/auth-backend/oauth/exchange?ott=${ott}`, {
      method: "GET",
      credentials: "include",
    })
      .then(async (r) => {
        const data = await r.json() as { ok?: boolean }
        if (r.ok && data.ok) {
          router.replace(dest)
        } else {
          setStatus("error")
          setTimeout(() => router.replace("/login?error=oauth_failed"), 2000)
        }
      })
      .catch(() => {
        setStatus("error")
        setTimeout(() => router.replace("/login?error=oauth_failed"), 2000)
      })
  }, [params, router])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center gap-4"
      style={{ backgroundColor: "#1e1912" }}>
      {status === "loading" ? (
        <>
          <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
          <p className="text-leather-ink-soft text-sm">Signing you in…</p>
        </>
      ) : (
        <p className="text-clay text-sm">Something went wrong. Redirecting…</p>
      )}
    </div>
  )
}

export default function AuthCallback() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "#1e1912" }}>
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    }>
      <CallbackInner />
    </Suspense>
  )
}
