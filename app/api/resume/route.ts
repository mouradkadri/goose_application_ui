import { NextRequest, NextResponse } from 'next/server'
import { hfAuthHeaders } from '@/lib/backend-auth'

const backend = () => {
  const url = process.env.BACKEND_URL
  if (!url) throw new Error('BACKEND_URL not set')
  return url
}

// POST /api/resume → /resume/upload/ (stores server-side)
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const sessionId = request.headers.get('x-session-id')
    const headers = hfAuthHeaders(sessionId ? { 'x-session-id': sessionId } : {})

    const upstream = await fetch(`${backend()}/resume/upload/`, {
      method: 'POST',
      headers,
      body: formData,
    })
    const text = await upstream.text()
    if (!upstream.ok) return NextResponse.json({ error: text }, { status: upstream.status })
    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}

// GET /api/resume → /resume/active/
export async function GET(request: NextRequest) {
  try {
    const sessionId = request.headers.get('x-session-id')
    if (!sessionId) return NextResponse.json({ error: 'No session' }, { status: 400 })
    const upstream = await fetch(`${backend()}/resume/active/`, {
      headers: hfAuthHeaders({ 'x-session-id': sessionId }),
    })
    const text = await upstream.text()
    if (!upstream.ok) return NextResponse.json({ error: text }, { status: upstream.status })
    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
