import { NextRequest, NextResponse } from 'next/server'
import { hfAuthHeaders } from '@/lib/backend-auth'

const backend = () => {
  const url = process.env.BACKEND_URL
  if (!url) throw new Error('BACKEND_URL not set')
  return url
}

// POST /api/jobs → /jobs/ (bulk upsert)
export async function POST(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id')
    const extra: Record<string, string> = { 'Content-Type': 'application/json' }
    if (sessionId) extra['x-session-id'] = sessionId

    const body = await request.json()
    const upstream = await fetch(`${backend()}/jobs/`, {
      method: 'POST',
      headers: hfAuthHeaders(extra),
      body: JSON.stringify(body),
    })
    const text = await upstream.text()
    if (!upstream.ok) return NextResponse.json({ error: text }, { status: upstream.status })
    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// GET /api/jobs → /jobs/ (supports ?limit=N&offset=N pass-through)
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id')
    const extra: Record<string, string> = {}
    if (sessionId) extra['x-session-id'] = sessionId

    // Forward pagination query params if present
    const searchParams = request.nextUrl.searchParams
    const params = new URLSearchParams()
    const limit = searchParams.get('limit')
    const offset = searchParams.get('offset')
    if (limit) params.set('limit', limit)
    if (offset) params.set('offset', offset)
    const qs = params.toString()

    const upstream = await fetch(`${backend()}/jobs/${qs ? `?${qs}` : ''}`, { headers: hfAuthHeaders(extra) })
    const text = await upstream.text()
    if (!upstream.ok) return NextResponse.json({ error: text }, { status: upstream.status })
    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
