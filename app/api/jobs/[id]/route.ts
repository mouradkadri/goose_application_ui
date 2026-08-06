import { NextRequest, NextResponse } from 'next/server'
import { hfAuthHeaders } from '@/lib/backend-auth'

const backend = () => {
  const url = process.env.BACKEND_URL
  if (!url) throw new Error('BACKEND_URL not set')
  return url
}

// PATCH /api/jobs/[id] → /jobs/{id}
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionId = request.headers.get('x-session-id')
    const extra: Record<string, string> = { 'Content-Type': 'application/json' }
    if (sessionId) extra['x-session-id'] = sessionId

    const body = await request.json()
    const upstream = await fetch(`${backend()}/jobs/${id}`, {
      method: 'PATCH',
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

// DELETE /api/jobs/[id] → /jobs/{id}
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const sessionId = request.headers.get('x-session-id')
    const extra: Record<string, string> = {}
    if (sessionId) extra['x-session-id'] = sessionId

    const upstream = await fetch(`${backend()}/jobs/${id}`, {
      method: 'DELETE',
      headers: hfAuthHeaders(extra),
    })
    const text = await upstream.text()
    if (!upstream.ok) return NextResponse.json({ error: text }, { status: upstream.status })
    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
