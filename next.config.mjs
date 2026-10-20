import { withSentryConfig } from "@sentry/nextjs/config"

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    unoptimized: true,
  },
}

// withSentryConfig wires source-map upload + auto-instrumentation. Source-map upload
// only runs when SENTRY_AUTH_TOKEN (+ org/project) are set, so builds without Sentry
// credentials (local dev, CI) proceed normally. `silent` keeps CI logs clean.
export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: !process.env.CI,
})
