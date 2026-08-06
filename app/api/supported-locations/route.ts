import { NextResponse } from 'next/server'
import { hfAuthHeaders } from '@/lib/backend-auth'

export async function GET() {
  try {
    const backendUrl = process.env.BACKEND_URL
    if (!backendUrl) return NextResponse.json({ error: 'BACKEND_URL not set' }, { status: 500 })

    const upstream = await fetch(`${backendUrl}/supported-locations/`, {
      headers: hfAuthHeaders(),
    })
    const text = await upstream.text()
    if (!upstream.ok) return NextResponse.json({ error: text }, { status: upstream.status })
    return new NextResponse(text, { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
