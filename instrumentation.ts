// Server-side instrumentation entrypoint (Next.js file convention).
// Loads the matching Sentry runtime config; both are no-ops without SENTRY_DSN.
import * as Sentry from "@sentry/nextjs"

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config")
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config")
  }
}

// Report server-side render/route errors to Sentry (no-op when Sentry isn't initialised).
export const onRequestError = Sentry.captureRequestError
