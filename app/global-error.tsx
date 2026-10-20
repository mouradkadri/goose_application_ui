"use client"

// Root error boundary. Reports uncaught render errors to Sentry (no-op when Sentry
// isn't initialised) and shows a minimal fallback. Must render its own <html>/<body>
// because it replaces the root layout when it triggers.
import * as Sentry from "@sentry/nextjs"
import { useEffect } from "react"

export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    Sentry.captureException(error)
  }, [error])

  return (
    <html lang="en">
      <body style={{ fontFamily: "system-ui, sans-serif", padding: "4rem", textAlign: "center" }}>
        <h1 style={{ fontSize: "1.5rem", marginBottom: "0.5rem" }}>Something went wrong</h1>
        <p style={{ color: "#666" }}>
          An unexpected error occurred. Please refresh the page or try again shortly.
        </p>
      </body>
    </html>
  )
}
