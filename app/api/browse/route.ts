import { NextRequest, NextResponse } from 'next/server'
import { hfAuthHeaders } from '@/lib/backend-auth'

// GET /api/browse/ → /browse/
// Long-running: hits 65+ company ATS boards concurrently — 20-30s typical
export async function GET(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) return NextResponse.json({ error: 'BACKEND_URL not set.' }, { status: 500 })

  const { searchParams } = new URL(request.url)
  const role = searchParams.get('role') ?? ''
  const location = searchParams.get('location') ?? ''
  const countryCode = searchParams.get('country_code') ?? ''

  const params = new URLSearchParams({ role, location })
  if (countryCode) params.set('country_code', countryCode)

  try {
    const upstream = await fetch(`${backendUrl}/browse/?${params}`, {
      headers: hfAuthHeaders({}),
      signal: AbortSignal.timeout(45_000),
    })
    const text = await upstream.text()
    if (!upstream.ok) return NextResponse.json({ error: text }, { status: upstream.status })
    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : String(e)
    return NextResponse.json({ error: msg }, { status: 503 })
  }
}
