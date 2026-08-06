import { NextRequest, NextResponse } from 'next/server'
import { hfAuthHeaders } from '@/lib/backend-auth'

export async function POST(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) return NextResponse.json({ error: 'BACKEND_URL not set.' }, { status: 500 })
  const body = await request.json()
  let upstream: Response
  try {
    upstream = await fetch(`${backendUrl}/scrape-job/`, {
      method: 'POST',
      headers: hfAuthHeaders({ 'Content-Type': 'application/json' }),
      body: JSON.stringify(body),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Backend unreachable'
    return NextResponse.json({ error: msg }, { status: 502 })
  }
  const text = await upstream.text()
  if (!upstream.ok) {
    // Try to parse the FastAPI error detail for a clean message
    try {
      const parsed = JSON.parse(text)
      return NextResponse.json({ error: parsed.detail ?? text }, { status: upstream.status })
    } catch {
      return NextResponse.json({ error: text.slice(0, 400) }, { status: upstream.status })
    }
  }
  return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
}
