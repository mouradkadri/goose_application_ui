import { NextRequest, NextResponse } from 'next/server'
import { hfAuthHeaders } from '@/lib/backend-auth'

export async function POST(request: NextRequest) {
  const backendUrl = process.env.BACKEND_URL
  if (!backendUrl) return NextResponse.json({ error: 'BACKEND_URL not set.' }, { status: 500 })
  const body = await request.json()
  const upstream = await fetch(`${backendUrl}/generate/cover-letter/`, {
    method: 'POST',
    headers: hfAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(body),
  })
  const text = await upstream.text()
  if (!upstream.ok) return NextResponse.json({ error: text }, { status: upstream.status })
  return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
}
